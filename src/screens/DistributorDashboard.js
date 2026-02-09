import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RNCamera } from 'react-native-camera';
import * as Location from 'expo-location';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const DistributorDashboard = ({ navigation }) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [stats, setStats] = useState({
    todayScans: 0,
    totalScans: 0,
    anomalies: 0,
  });

  const apiService = new ApiService();

  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = () => {
    // Demo data
    setRecentScans([
      {
        batchId: 'BATCH-001',
        productType: 'Organic Rice',
        location: 'Bangalore Warehouse',
        timestamp: new Date().toISOString(),
        anomaly: false,
      },
      {
        batchId: 'BATCH-002',
        productType: 'Fresh Vegetables',
        location: 'Chennai Distribution Center',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        anomaly: false,
      },
      {
        batchId: 'BATCH-003',
        productType: 'Wheat Flour',
        location: 'Delhi Warehouse',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        anomaly: true,
      },
    ]);

    setStats({
      todayScans: 8,
      totalScans: 45,
      anomalies: 2,
    });
  };

  const handleBarCodeRead = async ({ data }) => {
    if (scanning) return; // Prevent multiple scans

    setScanning(true);

    try {
      // Parse QR code data
      const batchData = JSON.parse(data);
      const batchId = batchData.batchId;

      // Get current location
      const location = await getCurrentLocation();

      // Record checkpoint
      await recordCheckpoint(batchId, location);
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code or scan failed');
    } finally {
      setScanning(false);
      setShowScanner(false);
    }
  };

 const getCurrentLocation = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    throw error;
  }
};

  const recordCheckpoint = async (batchId, location) => {
    try {
      const checkpointData = {
        batchId,
        location,
        timestamp: new Date().toISOString(),
        scannerRole: 'distributor',
      };

      const result = await apiService.recordCheckpoint(checkpointData);

      // Add to recent scans
      const newScan = {
        batchId,
        productType: result.productType || 'Unknown',
        location: 'Current Location',
        timestamp: new Date().toISOString(),
        anomaly: result.anomalyDetected || false,
      };

      setRecentScans([newScan, ...recentScans]);
      setStats({
        ...stats,
        todayScans: stats.todayScans + 1,
        totalScans: stats.totalScans + 1,
        anomalies: result.anomalyDetected ? stats.anomalies + 1 : stats.anomalies,
      });

      if (result.anomalyDetected) {
        Alert.alert(
          '⚠️ Anomaly Detected',
          `${result.anomalyType}\n\n${result.anomalyDetails}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Checkpoint recorded on blockchain!', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record checkpoint');
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

  const renderScanCard = (scan) => {
    const timeAgo = getTimeAgo(scan.timestamp);

    return (
      <View
        key={`${scan.batchId}-${scan.timestamp}`}
        style={[
          styles.scanCard,
          scan.anomaly && styles.scanCardAnomaly,
        ]}>
        <View style={styles.scanHeader}>
          <Text style={styles.scanBatchId}>{scan.batchId}</Text>
          {scan.anomaly && (
            <View style={styles.anomalyBadge}>
              <Icon name="warning" size={16} color="#fff" />
              <Text style={styles.anomalyText}>ANOMALY</Text>
            </View>
          )}
        </View>

        <View style={styles.scanInfo}>
          <View style={styles.scanRow}>
            <Icon name="category" size={16} color="#666" />
            <Text style={styles.scanText}>{scan.productType}</Text>
          </View>
          <View style={styles.scanRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.scanText}>{scan.location}</Text>
          </View>
          <View style={styles.scanRow}>
            <Icon name="access-time" size={16} color="#666" />
            <Text style={styles.scanText}>{timeAgo}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Distributor Dashboard</Text>
          <Text style={styles.headerSubtitle}>Scan and track batches</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <ScrollView>
        <View style={styles.statsContainer}>
          {renderStatCard("Today's Scans", stats.todayScans, 'today', '#2196F3')}
          {renderStatCard('Total Scans', stats.totalScans, 'qr-code-scanner', '#4CAF50')}
          {renderStatCard('Anomalies', stats.anomalies, 'warning', '#F44336')}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}>
          <Icon name="qr-code-scanner" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        {/* Recent Scans */}
        <View style={styles.recentScansContainer}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {recentScans.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="qr-code-scanner" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the scan button to record your first checkpoint
              </Text>
            </View>
          ) : (
            recentScans.map(renderScanCard)
          )}
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}>
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              style={styles.closeButton}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan QR Code</Text>
            <View style={{ width: 28 }} />
          </View>

          <RNCamera
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            onBarCodeRead={handleBarCodeRead}
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}>
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerBox}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scannerInstructions}>
                {scanning ? 'Processing...' : 'Align QR code within the frame'}
              </Text>
              {scanning && (
                <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
              )}
            </View>
          </RNCamera>
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
  scanButton: {
    backgroundColor: '#2E7D32',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentScansContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  scanCardAnomaly: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanBatchId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  anomalyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  anomalyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanInfo: {
    gap: 8,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanText: {
    fontSize: 14,
    color: '#666',
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeButton: {
    padding: 8,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2E7D32',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerInstructions: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
  },
});

export default DistributorDashboard;