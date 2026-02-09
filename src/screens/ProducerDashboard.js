import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import ApiService from '../services/ApiService';

const ProducerDashboard = ({ navigation }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [productType, setProductType] = useState('');
  const [quantity, setQuantity] = useState('');

  const apiService = new ApiService();

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await apiService.getProducerBatches();
      setBatches(data || getDemoBatches());
    } catch (error) {
      setBatches(getDemoBatches());
    } finally {
      setLoading(false);
    }
  };

  const getDemoBatches = () => {
    return [
      {
        batchId: 'BATCH-001',
        productType: 'Organic Rice',
        quantity: 1000,
        productionDate: '2025-01-25',
        expiryDate: '2026-01-25',
        status: 'In Transit',
        checkpoints: 3,
        currentLocation: 'Bangalore Warehouse',
      },
      {
        batchId: 'BATCH-002',
        productType: 'Fresh Vegetables',
        quantity: 500,
        productionDate: '2025-01-26',
        expiryDate: '2025-02-02',
        status: 'At Warehouse',
        checkpoints: 2,
        currentLocation: 'Chennai Warehouse',
      },
      {
        batchId: 'BATCH-003',
        productType: 'Wheat Flour',
        quantity: 2000,
        productionDate: '2025-01-27',
        expiryDate: '2025-07-27',
        status: 'At Farm',
        checkpoints: 1,
        currentLocation: 'Green Valley Farm, Chennai',
      },
    ];
  };

  const handleCreateBatch = async () => {
    if (!productType || !quantity) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const newBatch = {
      batchId: `BATCH-${Date.now()}`,
      productType,
      quantity: parseInt(quantity),
      productionDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'At Farm',
      checkpoints: 1,
      currentLocation: 'Farm',
    };

    try {
      await apiService.createBatch(newBatch);
      setBatches([newBatch, ...batches]);
      setShowCreateModal(false);
      setProductType('');
      setQuantity('');
      
      setSelectedBatch(newBatch);
      setShowQRModal(true);
    } catch (error) {
      // Demo mode - add locally
      setBatches([newBatch, ...batches]);
      setShowCreateModal(false);
      setProductType('');
      setQuantity('');
      setSelectedBatch(newBatch);
      setShowQRModal(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit':
        return '#FF9800';
      case 'Delivered':
        return '#4CAF50';
      case 'At Warehouse':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={32} color={color} />
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderBatchCard = (batch) => (
    <TouchableOpacity
      key={batch.batchId}
      style={styles.batchCard}
      onPress={() => navigation.navigate('BatchDetails', { batch })}>
      <View style={styles.batchHeader}>
        <Text style={styles.batchId}>{batch.batchId}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(batch.status) + '20' },
          ]}>
          <Text style={[styles.statusText, { color: getStatusColor(batch.status) }]}>
            {batch.status}
          </Text>
        </View>
      </View>

      <View style={styles.batchInfo}>
        <View style={styles.infoRow}>
          <Icon name="category" size={18} color="#666" />
          <Text style={styles.infoText}>{batch.productType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="scale" size={18} color="#666" />
          <Text style={styles.infoText}>{batch.quantity} kg</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="location-on" size={18} color="#666" />
          <Text style={styles.infoText}>{batch.currentLocation}</Text>
        </View>
      </View>

      <View style={styles.batchFooter}>
        <View style={styles.checkpointInfo}>
          <Icon name="timeline" size={16} color="#2E7D32" />
          <Text style={styles.checkpointText}>
            {batch.checkpoints} checkpoints
          </Text>
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => {
            setSelectedBatch(batch);
            setShowQRModal(true);
          }}>
          <Icon name="qr-code" size={20} color="#2E7D32" />
          <Text style={styles.qrButtonText}>QR Code</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const totalBatches = batches.length;
  const inTransit = batches.filter((b) => b.status === 'In Transit').length;
  const delivered = batches.filter((b) => b.status === 'Delivered').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome, Producer</Text>
          <Text style={styles.headerSubtitle}>Manage your food batches</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBatches} />}>
        <View style={styles.statsContainer}>
          {renderStatCard('Total Batches', totalBatches, 'inventory-2', '#2196F3')}
          {renderStatCard('In Transit', inTransit, 'local-shipping', '#FF9800')}
          {renderStatCard('Delivered', delivered, 'check-circle', '#4CAF50')}
        </View>

        {/* Batches List */}
        <View style={styles.batchesContainer}>
          <Text style={styles.sectionTitle}>My Batches</Text>
          {batches.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="inventory-2" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No batches created yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create your first batch
              </Text>
            </View>
          ) : (
            batches.map(renderBatchCard)
          )}
        </View>
      </ScrollView>

      {/* Create Batch Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Batch Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Batch</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Product Type (e.g., Organic Rice)"
              value={productType}
              onChangeText={setProductType}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Quantity (kg)"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateBatch}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrModalTitle}>QR Code</Text>
            {selectedBatch && (
              <>
                <Text style={styles.qrBatchId}>{selectedBatch.batchId}</Text>
                <View style={styles.qrCodeContainer}>
                  <QRCode
                    value={JSON.stringify({
                      batchId: selectedBatch.batchId,
                      productType: selectedBatch.productType,
                      quantity: selectedBatch.quantity,
                      createdAt: selectedBatch.productionDate,
                    })}
                    size={250}
                  />
                </View>
                <Text style={styles.qrProductType}>
                  {selectedBatch.productType}
                </Text>
                <Text style={styles.qrQuantity}>
                  {selectedBatch.quantity} kg
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => setShowQRModal(false)}>
              <Text style={styles.qrCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
    elevation: 2,
  },
  statInfo: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  batchesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  batchHeader: {
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
  batchInfo: {
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
  batchFooter: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  createButton: {
    backgroundColor: '#2E7D32',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '90%',
  },
  qrModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  qrBatchId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  qrProductType: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
  },
  qrQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  qrCloseButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  qrCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProducerDashboard;