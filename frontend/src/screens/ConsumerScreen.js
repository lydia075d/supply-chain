import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const ConsumerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

 
  const handleBarCodeRead = async ({ data }) => {
    if (scanning) return;

    setScanning(true);
    setShowScanner(false);

    try {
      const batchData = JSON.parse(data);
      const batchId = batchData.batchId;

      // Verify batch
      const result = await ApiService.verifyBatch(batchId);
      
      setVerificationResult(result || getDemoResult(batchId));
      setShowResult(true);
    } catch (error) {
      // Demo mode
      const batchData = JSON.parse(data);
      setVerificationResult(getDemoResult(batchData.batchId));
      setShowResult(true);
    } finally {
      setScanning(false);
    }
  };

  const getDemoResult = (batchId) => {
    return {
      batchId,
      isAuthentic: true,
      productType: 'Organic Rice',
      producer: 'Green Valley Farm, Chennai',
      quantity: '1000 kg',
      productionDate: '2025-01-25',
      expiryDate: '2026-01-25',
      fssaiLicense: '12345678901234',
      checkpoints: [
        {
          location: 'Green Valley Farm, Chennai',
          timestamp: '2025-01-25 08:00 AM',
          status: 'Produced',
        },
        {
          location: 'Chennai Warehouse',
          timestamp: '2025-01-25 02:00 PM',
          status: 'Received',
        },
        {
          location: 'Bangalore Distribution Center',
          timestamp: '2025-01-26 10:00 AM',
          status: 'In Transit',
        },
      ],
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Verify Product</Text>
          <Text style={styles.headerSubtitle}>Scan QR code to verify</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Icon name="qr-code-scanner" size={120} color="#366d80ff" />
        <Text style={styles.title}>Verify Food Product</Text>
        <Text style={styles.subtitle}>
          Scan the QR code on your food product to view its complete journey
          from farm to your table
        </Text>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setShowScanner(true)}>
          <Icon name="qr-code-scanner" size={32} color="#fff" />
          <Text style={styles.scanButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Icon name="verified" size={32} color="#4CAF50" />
            <Text style={styles.featureTitle}>Authentic</Text>
            <Text style={styles.featureText}>Verify product authenticity</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="timeline" size={32} color="#2196F3" />
            <Text style={styles.featureTitle}>Track Journey</Text>
            <Text style={styles.featureText}>See complete supply chain</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="security" size={32} color="#FF9800" />
            <Text style={styles.featureTitle}>Blockchain</Text>
            <Text style={styles.featureText}>Tamper-proof records</Text>
          </View>
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
            <Text style={styles.scannerTitle}>Scan Product QR Code</Text>
            <View style={{ width: 28 }} />
          </View>

          <CameraView
  style={styles.camera}
  facing="back"
  onBarcodeScanned={handleBarCodeRead}
  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}>
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerBox}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.scannerInstructions}>
                Align QR code within the frame
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Verification Result Modal */}
      <Modal
        visible={showResult}
        animationType="slide"
        onRequestClose={() => setShowResult(false)}>
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <TouchableOpacity
              onPress={() => setShowResult(false)}
              style={styles.closeButton}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.resultHeaderTitle}>Verification Result</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.resultContent}>
            {verificationResult && (
              <>
                {/* Authenticity Status */}
                <View
                  style={[
                    styles.authenticityBadge,
                    {
                      backgroundColor: verificationResult.isAuthentic
                        ? '#4CAF50'
                        : '#F44336',
                    },
                  ]}>
                  <Icon
                    name={verificationResult.isAuthentic ? 'verified' : 'error'}
                    size={48}
                    color="#fff"
                  />
                  <Text style={styles.authenticityText}>
                    {verificationResult.isAuthentic
                      ? 'Product Verified ✓'
                      : 'Not Authentic ✗'}
                  </Text>
                </View>

                {/* Product Details */}
                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Product Details</Text>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Batch ID:</Text>
                    <Text style={styles.resultValue}>{verificationResult.batchId}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Product:</Text>
                    <Text style={styles.resultValue}>{verificationResult.productType}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Producer:</Text>
                    <Text style={styles.resultValue}>{verificationResult.producer}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Quantity:</Text>
                    <Text style={styles.resultValue}>{verificationResult.quantity}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Production:</Text>
                    <Text style={styles.resultValue}>{verificationResult.productionDate}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Expiry:</Text>
                    <Text style={styles.resultValue}>{verificationResult.expiryDate}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>FSSAI:</Text>
                    <Text style={styles.resultValue}>{verificationResult.fssaiLicense}</Text>
                  </View>
                </View>

                {/* Journey/Checkpoints */}
                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Product Journey</Text>
                  {verificationResult.checkpoints.map((checkpoint, index) => (
                    <View key={index} style={styles.checkpointItem}>
                      <View style={styles.checkpointIndicator}>
                        <View style={styles.checkpointDot} />
                        {index < verificationResult.checkpoints.length - 1 && (
                          <View style={styles.checkpointLine} />
                        )}
                      </View>
                      <View style={styles.checkpointDetails}>
                        <Text style={styles.checkpointLocation}>
                          {checkpoint.location}
                        </Text>
                        <Text style={styles.checkpointTime}>{checkpoint.timestamp}</Text>
                        <View style={styles.checkpointStatusBadge}>
                          <Text style={styles.checkpointStatus}>{checkpoint.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
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
    backgroundColor: '#366d80ff',
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
  content: {
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#366d80ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 12,
    marginTop: 32,
    elevation: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  features: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 16,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
    borderColor: '#366d80ff',
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
  resultContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  resultHeader: {
    backgroundColor: '#366d80ff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  resultHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultContent: {
    flex: 1,
    padding: 16,
  },
  authenticityBadge: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  authenticityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  resultSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
  },
  checkpointItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  checkpointIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  checkpointDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#366d80ff',
  },
  checkpointLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#366d80ff',
    marginTop: 4,
  },
  checkpointDetails: {
    flex: 1,
  },
  checkpointLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  checkpointTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  checkpointStatusBadge: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  checkpointStatus: {
    fontSize: 12,
    color: '#366d80ff',
    fontWeight: '600',
  },
});

export default ConsumerScreen;