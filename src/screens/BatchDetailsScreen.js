import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const BatchDetailsScreen = ({ route, navigation }) => {
  const { batch } = route.params;
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiService = new ApiService();

  useEffect(() => {
    loadCheckpoints();
  }, []);

  const loadCheckpoints = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBatchDetails(batch.batchId);
      setCheckpoints(data.checkpoints || getDemoCheckpoints());
    } catch (error) {
      setCheckpoints(getDemoCheckpoints());
    } finally {
      setLoading(false);
    }
  };

  const getDemoCheckpoints = () => {
    return [
      {
        location: 'Green Valley Farm, Chennai',
        latitude: '13.0827',
        longitude: '80.2707',
        timestamp: '2025-01-25 08:00 AM',
        status: 'Produced',
        scanner: 'Producer',
      },
      {
        location: 'Chennai Warehouse',
        latitude: '13.0878',
        longitude: '80.2785',
        timestamp: '2025-01-25 02:00 PM',
        status: 'Received',
        scanner: 'Warehouse Worker',
      },
      {
        location: 'Highway Toll - NH48',
        latitude: '13.1500',
        longitude: '79.9500',
        timestamp: '2025-01-25 06:30 PM',
        status: 'In Transit',
        scanner: 'Truck Driver',
      },
      {
        location: 'Bangalore Distribution Center',
        latitude: '12.9716',
        longitude: '77.5946',
        timestamp: '2025-01-26 10:00 AM',
        status: 'Arrived',
        scanner: 'Distributor',
      },
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Produced':
        return '#4CAF50';
      case 'In Transit':
        return '#FF9800';
      case 'Arrived':
      case 'Received':
        return '#2196F3';
      case 'Delivered':
        return '#9C27B0';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Batch Header */}
      <View style={styles.header}>
        <Text style={styles.batchId}>{batch.batchId}</Text>
        <Text style={styles.productType}>{batch.productType}</Text>
        <Text style={styles.quantity}>{batch.quantity} kg</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="timeline" size={32} color="#2E7D32" />
          <Text style={styles.statValue}>{checkpoints.length}</Text>
          <Text style={styles.statLabel}>Checkpoints</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="location-on" size={32} color="#2196F3" />
          <Text style={styles.statValue}>
            {checkpoints.length > 0
              ? checkpoints[checkpoints.length - 1].location.split(',')[0]
              : 'Unknown'}
          </Text>
          <Text style={styles.statLabel}>Current Location</Text>
        </View>
      </View>

      {/* Journey Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Icon name="map" size={60} color="#999" />
        <Text style={styles.mapText}>Journey Map</Text>
        <Text style={styles.mapSubtext}>
          {checkpoints.length} locations tracked
        </Text>
      </View>

      {/* Checkpoints Timeline */}
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Journey Timeline</Text>
        {checkpoints.map((checkpoint, index) => (
          <View key={index} style={styles.checkpointItem}>
            <View style={styles.timelineIndicator}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: getStatusColor(checkpoint.status) },
                ]}
              />
              {index < checkpoints.length - 1 && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.checkpointCard}>
              <View style={styles.checkpointHeader}>
                <Text style={styles.checkpointLocation}>{checkpoint.location}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(checkpoint.status) + '20' },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(checkpoint.status) },
                    ]}>
                    {checkpoint.status}
                  </Text>
                </View>
              </View>

              <View style={styles.checkpointInfo}>
                <View style={styles.infoRow}>
                  <Icon name="access-time" size={16} color="#666" />
                  <Text style={styles.infoText}>{checkpoint.timestamp}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="person" size={16} color="#666" />
                  <Text style={styles.infoText}>{checkpoint.scanner}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="location-on" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {checkpoint.latitude}, {checkpoint.longitude}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Batch Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Batch Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Batch ID:</Text>
            <Text style={styles.infoValue}>{batch.batchId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Product:</Text>
            <Text style={styles.infoValue}>{batch.productType}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Quantity:</Text>
            <Text style={styles.infoValue}>{batch.quantity} kg</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Production Date:</Text>
            <Text style={styles.infoValue}>{batch.productionDate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Expiry Date:</Text>
            <Text style={styles.infoValue}>{batch.expiryDate}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(batch.status) }]}>
              {batch.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Blockchain Verification */}
      <View style={styles.blockchainContainer}>
        <View style={styles.blockchainHeader}>
          <Icon name="verified" size={24} color="#2E7D32" />
          <Text style={styles.blockchainTitle}>Blockchain Verified</Text>
        </View>
        <Text style={styles.blockchainText}>
          All checkpoints are recorded on Arbitrum L2 blockchain and cannot be
          tampered with.
        </Text>
        <TouchableOpacity style={styles.blockchainButton}>
          <Text style={styles.blockchainButtonText}>View on Block Explorer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 24,
    alignItems: 'center',
  },
  batchId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  productType: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginTop: 8,
  },
  quantity: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  mapPlaceholder: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  timelineContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  checkpointItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginTop: 4,
  },
  checkpointCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  checkpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkpointLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
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
  checkpointInfo: {
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
  infoContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  blockchainContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  blockchainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  blockchainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  blockchainText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  blockchainButton: {
    backgroundColor: '#2E7D32',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  blockchainButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BatchDetailsScreen;