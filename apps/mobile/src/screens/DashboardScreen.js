import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { captureAndQueueEvent } from '../crypto/eventCapturer';
import { synchronizeOfflineEvents } from '../api/syncManager';

export default function DashboardScreen({ user, userKeys, batchId }) {
  const [syncing, setSyncing] = useState(false);

  // Example handler for capturing a harvest event
  const handleLogHarvest = async () => {
    try {
      const event = await captureAndQueueEvent({
        batchId: batchId || 'BATCH-2026-ASHWA-001',
        actorId: user?.id || 'FARMER_01',
        stage: 'COLLECTION',
        payloadData: {
          harvestWeightKg: 150,
          location: 'Shimoga, Karnataka',
          qualityGrade: 'A+'
        },
        privateKeyBase64: userKeys?.privateKey
      });

      Alert.alert('Event Captured!', `Signed event ${event.eventId} saved to local offline queue.`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Handler to push local queue to server when internet is available
  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await synchronizeOfflineEvents();
      Alert.alert('Sync Complete', `Successfully uploaded ${result.syncedCount} queued events to server.`);
    } catch (err) {
      Alert.alert('Sync Error', err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AyuVerify Stakeholder Portal</Text>
      <Text style={styles.subtitle}>Role: {user?.role || 'FARMER'}</Text>

      <View style={styles.buttonContainer}>
        <Button title="Log Harvest Event (Offline-Ready)" onPress={handleLogHarvest} color="#2e7d32" />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={syncing ? "Syncing..." : "Sync Queued Events to Server"} 
          onPress={handleSync} 
          color="#1565c0"
          disabled={syncing} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#1b5e20' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#555' },
  buttonContainer: { marginVertical: 10 }
});