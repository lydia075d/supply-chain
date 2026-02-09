import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BatchCard = ({ batch, onPress, onQRPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit':
        return '#FF9800';
      case 'Delivered':
        return '#4CAF50';
      case 'At Warehouse':
        return '#2196F3';
      case 'At Farm':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.batchId}>{batch.batchId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(batch.status) + '20' },
          ]}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(batch.status) },
            ]}>
            {batch.status}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Icon name="category" size={18} color="#666" />
          <Text style={styles.infoText}>{batch.productType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="scale" size={18} color="#666" />
          <Text style={styles.infoText}>{batch.quantity} kg</Text>
        </View>
        {batch.currentLocation && (
          <View style={styles.infoRow}>
            <Icon name="location-on" size={18} color="#666" />
            <Text style={styles.infoText}>{batch.currentLocation}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.checkpointInfo}>
          <Icon name="timeline" size={16} color="#2E7D32" />
          <Text style={styles.checkpointText}>
            {batch.checkpoints || 0} checkpoints
          </Text>
        </View>
        {onQRPress && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={(e) => {
              e.stopPropagation();
              onQRPress(batch);
            }}>
            <Icon name="qr-code" size={20} color="#2E7D32" />
            <Text style={styles.qrButtonText}>QR Code</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checkpointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkpointText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qrButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default BatchCard;