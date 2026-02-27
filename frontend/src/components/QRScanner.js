import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const QRScanner = ({ visible, onClose, onScan, title = 'Scan QR Code' }) => {
  const [scanning, setScanning] = useState(false);

  const handleBarCodeRead = async ({ data }) => {
    if (scanning) return;

    setScanning(true);

    try {
      await onScan(data);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setTimeout(() => {
        setScanning(false);
      }, 2000);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 28 }} />
        </View>

        <RNCamera
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          onBarCodeRead={handleBarCodeRead}
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
          captureAudio={false}>
          <View style={styles.overlay}>
            <View style={styles.scanBox}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>

            <Text style={styles.instructions}>
              {scanning ? 'Processing...' : 'Align QR code within the frame'}
            </Text>

            {scanning && (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={styles.loader}
              />
            )}
          </View>
        </RNCamera>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
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
  instructions: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default QRScanner;