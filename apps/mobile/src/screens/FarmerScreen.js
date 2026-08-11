import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { captureOfflineEvent, syncPendingEvents, getPendingCount } from '../database/offlineQueue';
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

  useEffect(() => {
    refreshCount();
  }, []);

  const refreshCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

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
      refreshCount();
    } catch (err) {
      Alert.alert('Capture Failed', err.message);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const syncedCount = await syncPendingEvents('http://localhost:5000');
      Alert.alert('Sync Complete', `Successfully uploaded ${syncedCount} queued events to server.`);
      refreshCount();
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
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});