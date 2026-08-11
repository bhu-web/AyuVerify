import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraModal({ visible, onClose, onPhotoCaptured }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required to capture photos of raw herbs.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options = { quality: 0.5, base64: true };
        const data = await cameraRef.current.takePictureAsync(options);
        setPhotoUri(data.uri);
      } catch (err) {
        Alert.alert('Capture Error', 'Failed to take herb photograph.');
      }
    }
  };

  const handleConfirmPhoto = () => {
    onPhotoCaptured(photoUri);
    setPhotoUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {photoUri ? (
          // Photo Preview View
          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.retakeButton} onPress={() => setPhotoUri(null)}>
                <Text style={styles.buttonText}>Retake Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPhoto}>
                <Text style={styles.buttonText}>Attach Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Live Camera View
          <CameraView style={StyleSheet.absoluteFillObject} ref={cameraRef}>
            <View style={styles.overlay}>
              <Text style={styles.instructionText}>Frame raw herbs clearly in good light</Text>
              <View style={styles.captureControls}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureInnerCircle} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 50 },
  instructionText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  captureControls: { alignItems: 'center', gap: 16 },
  captureButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
  captureInnerCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#10b981' },
  closeButton: { padding: 10 },
  previewContainer: { flex: 1, justifyContent: 'space-between', padding: 20 },
  previewImage: { flex: 1, borderRadius: 16, marginBottom: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 12 },
  retakeButton: { backgroundColor: '#64748b', padding: 14, borderRadius: 10, flex: 1, alignItems: 'center' },
  confirmButton: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, flex: 1, alignItems: 'center' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' },
  permissionText: { fontSize: 15, textAlign: 'center', marginBottom: 20, color: '#334155' },
  permissionButton: { backgroundColor: '#10b981', padding: 12, borderRadius: 8, marginBottom: 10 },
  cancelButton: { padding: 10 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  cancelText: { color: '#cbd5e1', fontWeight: '600' }
});