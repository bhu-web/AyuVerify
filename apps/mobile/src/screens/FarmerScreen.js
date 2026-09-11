import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { captureOfflineEvent, syncPendingEvents, getPendingCount, getPendingEvents } from '../database/offlineQueue';
import CameraModal from '../components/CameraModal';

export default function FarmerScreen() {
  const [farmerId, setFarmerId] = useState('FARMER_01');
  const [cropName, setCropName] = useState('Ashwagandha Root');
  const [weightKg, setWeightKg] = useState('50');
  const [gpsLocation, setGpsLocation] = useState('12.9716° N, 77.5946° E');
  const [herbPhotoUri, setHerbPhotoUri] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queue, setQueue] = useState([]);

  const refreshCount = async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Failed to get pending count:', err);
    }
  };

  const refreshQueue = async () => {
    try {
      const items = await getPendingEvents();
      setQueue(items || []);
    } catch (err) {
      console.error('Failed to read offline queue:', err);
    }
  };

  // Sync both badge count and queue records on mount
  useEffect(() => {
    refreshCount();
    refreshQueue();
  }, []);

  const handleCaptureCollection = async () => {
    if (!cropName || !weightKg) {
      Alert.alert('Validation Error', 'Please specify crop name and weight.');
      return;
    }

    if (!herbPhotoUri) {
      Alert.alert('Photo Required', 'Please take a photograph of the raw harvested herbs before signing.');
      return;
    }

    const payload = {
      batchId: `BATCH-2026-RAW-${Date.now()}`,
      cropName,
      harvestWeightKg: parseFloat(weightKg),
      location: gpsLocation,
      herbPhotoUri,
      harvestDate: new Date().toISOString().split('T')[0]
    };

    try {
      await captureOfflineEvent({
        actorId: farmerId,
        stage: 'COLLECTION',
        payload
      });

      Alert.alert('Harvest Logged', 'Raw crop photo attached and signed into device offline queue.');
      setWeightKg('');
      setHerbPhotoUri(null);

      // Refresh both counters and list view immediately
      await refreshCount();
      await refreshQueue();
    } catch (err) {
      Alert.alert('Capture Failed', err.message);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const syncedCount = await syncPendingEvents('https://ayuverify-backend.onrender.com');
      Alert.alert('Sync Complete', `Successfully uploaded ${syncedCount} queued events to server.`);
      await refreshCount();
      await refreshQueue();
    } catch (err) {
      Alert.alert('Sync Error', 'Could not connect to server. Events remain safely queued locally.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Farmer Collection Portal 🌿</Text>
        <Text style={styles.subtitle}>Offline Raw Herb Photography & Harvest Logging</Text>
      </View>

      {/* Sync Status Banner */}
      <View style={styles.syncBanner}>
        <View>
          <Text style={styles.syncTitle}>Pending Offline Events</Text>
          <Text style={styles.syncCount}>{pendingCount} queued on device</Text>
        </View>
        <TouchableOpacity
          onPress={handleSyncNow}
          disabled={isSyncing || pendingCount === 0}
          style={[styles.syncButton, (isSyncing || pendingCount === 0) && styles.buttonDisabled]}
        >
          <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      {/* Harvest Entry Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log Raw Herbal Harvest</Text>

        {/* Herb Photo Section */}
        <Text style={styles.label}>Raw Crop Photograph</Text>
        {herbPhotoUri ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: herbPhotoUri }} style={styles.photoThumbnail} />
            <TouchableOpacity style={styles.retakePhotoButton} onPress={() => setCameraVisible(true)}>
              <Text style={styles.retakePhotoText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.takePhotoButton} onPress={() => setCameraVisible(true)}>
            <Text style={styles.takePhotoButtonText}>📷 Take Raw Herb Photo</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Farmer / Stakeholder ID</Text>
        <TextInput style={styles.input} value={farmerId} onChangeText={setFarmerId} />

        <Text style={styles.label}>Herb / Crop Name</Text>
        <TextInput style={styles.input} value={cropName} onChangeText={setCropName} />

        <Text style={styles.label}>Harvest Weight (kg)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />

        <Text style={styles.label}>GPS Coordinates / Origin</Text>
        <TextInput style={styles.input} value={gpsLocation} onChangeText={setGpsLocation} />

        <TouchableOpacity style={styles.submitButton} onPress={handleCaptureCollection}>
          <Text style={styles.submitButtonText}>Sign & Queue Event Offline</Text>
        </TouchableOpacity>
      </View>

      {/* Live Offline Queue Inspector for Evaluators */}
      <View style={styles.queueContainer}>
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>📦 Local SQLite Queue ({queue.length})</Text>
          <TouchableOpacity onPress={refreshQueue} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {queue.length === 0 ? (
          <Text style={styles.emptyText}>Queue is empty. All events have been synced!</Text>
        ) : (
          queue.map((item, index) => {
            const parsedPayload = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
            return (
              <View key={item.id || index} style={styles.queueCard}>
                <Text style={styles.badgeText}>Stage: {item.stage} | Batch: {item.batch_id}</Text>
                <Text style={styles.codeText}>SHA-256 Hash: {item.record_hash ? `${item.record_hash.substring(0, 24)}...` : 'N/A'}</Text>
                <Text style={styles.codeText}>Ed25519 Sig: {item.digital_signature ? `${item.digital_signature.substring(0, 28)}...` : 'N/A'}</Text>
                {parsedPayload?.herbPhotoUri && (
                  <Text style={styles.photoText}>📷 Photo Proof: Attached ({parsedPayload.cropName})</Text>
                )}
              </View>
            );
          })
        )}
      </View>

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onPhotoCaptured={(uri) => setHerbPhotoUri(uri)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  syncBanner: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  syncTitle: { fontSize: 12, color: '#047857', fontWeight: 'bold' },
  syncCount: { fontSize: 16, color: '#065f46', fontWeight: '800' },
  syncButton: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  syncButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  buttonDisabled: { opacity: 0.5 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#ffffff' },
  takePhotoButton: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#10b981', borderRadius: 12, padding: 20, alignItems: 'center', backgroundColor: '#f0fdf4' },
  takePhotoButtonText: { color: '#047857', fontWeight: 'bold', fontSize: 14 },
  photoContainer: { gap: 8, alignItems: 'center' },
  photoThumbnail: { width: '100%', height: 180, borderRadius: 12 },
  retakePhotoButton: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  retakePhotoText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  submitButton: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  queueContainer: { marginTop: 24, marginBottom: 40, padding: 14, backgroundColor: '#0f172a', borderRadius: 12 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  queueTitle: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  refreshBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
  queueCard: { backgroundColor: '#1e293b', padding: 10, borderRadius: 8, marginVertical: 4 },
  badgeText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  codeText: { color: '#cbd5e1', fontFamily: 'monospace', fontSize: 11 },
  photoText: { color: '#facc15', fontSize: 11, marginTop: 4, fontWeight: '600' }
});