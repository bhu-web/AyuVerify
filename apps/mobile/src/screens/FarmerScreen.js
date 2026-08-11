import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { captureOfflineEvent, syncPendingEvents, getPendingCount } from '../database/offlineQueue';

export default function FarmerScreen() {
  const [farmerId, setFarmerId] = useState('FARMER_01');
  const [cropName, setCropName] = useState('Ashwagandha Root');
  const [weightKg, setWeightKg] = useState('50');
  const [gpsLocation, setGpsLocation] = useState('12.9716° N, 77.5946° E');
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
      Alert.alert('Validation Error', 'Please fill in all crop details.');
      return;
    }

    const payload = {
      cropName,
      harvestWeightKg: parseFloat(weightKg),
      location: gpsLocation,
      harvestDate: new Date().toISOString().split('T')[0]
    };

    try {
      // Constructs payload, canonical hash, signs offline, and adds to local SQLite queue
      await captureOfflineEvent({
        actorId: farmerId,
        stage: 'COLLECTION',
        payload
      });

      Alert.alert('Offline Capture Success', 'Collection event signed and stored in device queue.');
      setWeightKg('');
      refreshCount();
    } catch (err) {
      Alert.alert('Capture Failed', err.message);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const syncedCount = await syncPendingEvents('http://localhost:5000');
      Alert.alert('Sync Complete', `Successfully uploaded ${syncedCount} queued events to AyuVerify server.`);
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
        <Text style={styles.subtitle}>Offline-First Herbal Harvest Logging</Text>
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
        <Text style={styles.cardTitle}>Log New Herbal Harvest</Text>

        <Text style={styles.label}>Farmer / Stakeholder ID</Text>
        <TextInput style={styles.input} value={farmerId} onChangeText={setFarmerId} />

        <Text style={styles.label}>Herb / Crop Name</Text>
        <TextInput style={styles.input} value={cropName} onChangeText={setCropName} />

        <Text style={styles.label}>Harvest Weight (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={weightKg}
          onChangeText={setWeightKg}
          placeholder="e.g. 50"
        />

        <Text style={styles.label}>GPS Coordinates / Origin</Text>
        <TextInput style={styles.input} value={gpsLocation} onChangeText={setGpsLocation} />

        <TouchableOpacity style={styles.submitButton} onPress={handleCaptureCollection}>
          <Text style={styles.submitButtonText}>Sign & Queue Event Offline</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  syncBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  syncTitle: { fontSize: 12, color: '#047857', fontWeight: 'bold' },
  syncCount: { fontSize: 16, color: '#065f46', fontWeight: '800' },
  syncButton: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  syncButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  buttonDisabled: { opacity: 0.5 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 14,
    backgroundColor: '#ffffff'
  },
  submitButton: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});