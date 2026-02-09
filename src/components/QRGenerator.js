import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

const QRGenerator = ({ visible, batch, onClose }) => {
  if (!batch) return null;

  const qrData = JSON.stringify({
    batchId: batch.batchId,
    productType: batch.productType,
    quantity: batch.quantity,
    createdAt: batch.productionDate || new Date().toISOString(),
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>QR Code</Text>
          <Text style={styles.batchId}>{batch.batchId}</Text>

          <View style={styles.qrCodeContainer}>
            <QRCode value={qrData} size={250} backgroundColor="white" />
          </View>

          <Text style={styles.productType}>{batch.productType}</Text>
          <Text style={styles.quantity}>{batch.quantity} kg</Text>

          <View style={styles.instructions}>
            <Icon name="info" size={20} color="#666" />
            <Text style={styles.instructionText}>
              Scan this QR code to track this batch
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.shareButton}>
              <Icon name="share" size={20} color="#2E7D32" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  batchId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    color: '#333',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRGenerator;