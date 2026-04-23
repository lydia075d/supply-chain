import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import ApiService from '../services/ApiService';

const ALERT_COLORS = {
  CRITICAL : '#D32F2F',
  HIGH     : '#F57C00',
  MEDIUM   : '#FBC02D',
  LOW      : '#388E3C',
  NONE     : '#9E9E9E',
};

const STATUS_COLORS = {
  'Dispatched' : '#2196F3',
  'Received'   : '#4CAF50',
  'On Shelf'   : '#9C27B0',
  'Sold Out'   : '#9E9E9E',
};

const RetailerDashboard = ({ navigation }) => {
  const [stock, setStock]         = useState([]);
  const [stats, setStats]         = useState({ total: 0, received: 0, flagged: 0, expiring: 0 });
  const [loading, setLoading]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockData, statsData] = await Promise.all([
        ApiService.getRetailerStock(),
        ApiService.getRetailerStats(),
      ]);
      setStock(stockData);
      setStats(statsData);
    } catch (err) {
      console.error('[Retailer] Load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReceive = async (retailBatchId) => {
    try {
      let location = { latitude: 0, longitude: 0 };
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          location  = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        }
      } catch (_) {}

      await ApiService.confirmRetailReceipt(retailBatchId, location);
      Alert.alert('✅ Received', 'Batch marked as received. AI fraud check running in background.');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleStatusUpdate = async (retailBatchId, status) => {
    try {
      await ApiService.updateRetailStatus(retailBatchId, status);
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const getExpiryInfo = (expiryDate) => {
    if (!expiryDate) return { label: 'N/A', color: '#9E9E9E' };
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0)  return { label: 'EXPIRED',       color: '#D32F2F' };
    if (days <= 7) return { label: `${days}d left`,  color: '#F57C00' };
    if (days <= 30) return { label: `${days}d left`, color: '#FBC02D' };
    return { label: `${days}d left`, color: '#388E3C' };
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={28} color={color} />
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderStockCard = (item) => {
    const expiry     = getExpiryInfo(item.expiryDate);
    const alertColor = ALERT_COLORS[item.fraudAlertLevel] || ALERT_COLORS.NONE;
    const statusColor = STATUS_COLORS[item.status] || '#9E9E9E';

    return (
      <View key={item.retailBatchId}
        style={[styles.card, item.isFraudFlagged && styles.cardFraud]}>

        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.batchId}>{item.retailBatchId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        {/* Product info */}
        <View style={styles.infoRow}>
          <Icon name="category" size={16} color="#666" />
          <Text style={styles.infoText}>{item.productType || 'Unknown Product'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="inventory" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.quantityReceived} units received
            {item.quantityRemaining !== undefined && ` · ${item.quantityRemaining} remaining`}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="event" size={16} color={expiry.color} />
          <Text style={[styles.infoText, { color: expiry.color, fontWeight: '600' }]}>
            Expiry: {expiry.label}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="local-shipping" size={16} color="#666" />
          <Text style={styles.infoText}>From: {item.parentBatchId}</Text>
        </View>

        {/* AI fraud alert */}
        {item.isFraudFlagged && (
          <View style={[styles.fraudBanner, { backgroundColor: alertColor }]}>
            <Icon name="warning" size={18} color="#fff" />
            <Text style={styles.fraudBannerText}>
              🚨 {item.fraudAlertLevel} FRAUD ALERT — {item.fraudTypes?.join(', ')}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {item.status === 'Dispatched' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleReceive(item.retailBatchId)}>
              <Icon name="check-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Confirm Receipt</Text>
            </TouchableOpacity>
          )}
          {item.status === 'Received' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]}
              onPress={() => handleStatusUpdate(item.retailBatchId, 'On Shelf')}>
              <Icon name="store" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Put On Shelf</Text>
            </TouchableOpacity>
          )}
          {item.status === 'On Shelf' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#9E9E9E' }]}
              onPress={() => handleStatusUpdate(item.retailBatchId, 'Sold Out')}>
              <Icon name="sell" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Mark Sold Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Retailer Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your stock</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {renderStatCard('Total Batches', stats.total,    'inventory',      '#2196F3')}
        {renderStatCard('Received',      stats.received, 'check-circle',   '#4CAF50')}
        {renderStatCard('Fraud Flagged', stats.flagged,  'warning',        '#F44336')}
        {renderStatCard('Expiring Soon', stats.expiring, 'event-busy',     '#FF9800')}
      </View>

      {/* Stock list */}
      {loading ? (
        <ActivityIndicator size="large" color="#366d80ff" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
          <Text style={styles.sectionTitle}>Your Stock ({stock.length})</Text>
          {stock.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="inventory" size={80} color="#ddd" />
              <Text style={styles.emptyText}>No stock assigned yet</Text>
              <Text style={styles.emptySubtext}>A distributor will assign batches to your account</Text>
            </View>
          ) : (
            stock.map(renderStockCard)
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: '#f5f5f5' },
  header          : { backgroundColor: '#366d80ff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle     : { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle  : { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  logoutBtn       : { padding: 8 },
  statsContainer  : { padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard        : { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 10, borderLeftWidth: 4, alignItems: 'center', flex: 1, minWidth: '45%', elevation: 2 },
  statInfo        : { marginLeft: 10 },
  statValue       : { fontSize: 22, fontWeight: 'bold', color: '#333' },
  statTitle       : { fontSize: 12, color: '#666', marginTop: 2 },
  sectionTitle    : { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 14 },
  card            : { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 3 },
  cardFraud       : { borderWidth: 2, borderColor: '#F44336' },
  cardHeader      : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  batchId         : { fontSize: 15, fontWeight: 'bold', color: '#366d80ff', flex: 1, marginRight: 8 },
  statusBadge     : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText       : { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  infoRow         : { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText        : { fontSize: 14, color: '#555', flex: 1 },
  fraudBanner     : { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, marginTop: 10, marginBottom: 6 },
  fraudBannerText : { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  actionRow       : { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn       : { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  actionBtnText   : { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyState      : { alignItems: 'center', paddingVertical: 60 },
  emptyText       : { fontSize: 18, color: '#999', marginTop: 16 },
  emptySubtext    : { fontSize: 14, color: '#bbb', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});

export default RetailerDashboard;