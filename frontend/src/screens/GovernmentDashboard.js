import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const GovernmentDashboard = ({ navigation }) => {
  const [alerts, setAlerts]       = useState([]);
  const [batches, setBatches]     = useState([]);
  const [stats, setStats]         = useState({
    totalBatches: 0, activeAlerts: 0, totalCheckpoints: 0, compliantBatches: 0,
  });
  const [loading, setLoading]     = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => { loadData(); }, []);

  // ── Derived lists ────────────────────────────────────────
  const activeAlerts   = alerts.filter(a => !a.resolved);
  const pendingBatches = batches.filter(b => b.approvalStatus === 'PENDING');

  // ── Load data: trigger AI scan → get alerts + batches ───
  const loadData = useCallback(async () => {
    setLoading(true);
    setScanning(true);
    setError(null);

    try {
      const [scanResult, batchesData] = await Promise.all([
        ApiService.triggerScanAndGetAlerts().catch(() => null),
        ApiService.getAllBatches().catch(() => []),
      ]);

      let alertsList;
      if (scanResult && Array.isArray(scanResult.alerts)) {
        alertsList = scanResult.alerts;
      } else {
        alertsList = await ApiService.getFraudAlerts().catch(() => []);
      }

      // Deduplicate alerts by _id
      const seen         = new Set();
      const uniqueAlerts = alertsList.filter(a => {
        const key = a._id || `${a.batchId}-${a.type}-${a.time}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const batchesList = Array.isArray(batchesData) ? batchesData : [];

      setAlerts(uniqueAlerts);
      setBatches(batchesList);
      setStats({
        totalBatches    : batchesList.length,
        activeAlerts    : uniqueAlerts.filter(a => !a.resolved).length,
        totalCheckpoints: batchesList.reduce((s, b) => s + (b.checkpoints || 0), 0),
        compliantBatches: batchesList.filter(b => !b.hasIssues).length,
      });
    } catch (err) {
      console.error('[Government] Failed to load data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }, []);

  // ── Resolve an alert ─────────────────────────────────────
  const handleResolve = async (alertId) => {
    try {
      await ApiService.resolveAlert(alertId);
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, resolved: true } : a));
      setStats(prev => ({ ...prev, activeAlerts: Math.max(0, prev.activeAlerts - 1) }));
    } catch (err) {
      console.error('[Government] Resolve failed:', err.message);
    }
  };

  // ── Approve / Reject a batch ─────────────────────────────
  const handleApprove = async (batchId) => {
    try {
      await ApiService.approveBatch(batchId);
      Alert.alert('Success', 'Batch approved');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleReject = async (batchId) => {
    try {
      await ApiService.rejectBatch(batchId);
      Alert.alert('Rejected', 'Batch rejected');
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  const getSeverityColor = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical': return '#D32F2F';
      case 'high':     return '#F57C00';
      case 'medium':   return '#FBC02D';
      default:         return '#757575';
    }
  };

  const getAlertIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('expired'))                           return 'event-busy';
    if (t.includes('duplicate'))                         return 'content-copy';
    if (t.includes('hoarding') || t.includes('bulk'))    return 'inventory';
    if (t.includes('missing') || t.includes('shipment')) return 'local-shipping';
    if (t.includes('storage'))                           return 'warehouse';
    if (t.includes('temperature'))                       return 'thermostat';
    if (t.includes('scalping'))                          return 'timeline';
    if (t.includes('fraud'))                             return 'error';
    return 'warning';
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60)  return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)  return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // ── Stat card ────────────────────────────────────────────
  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={26} color={color} />
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  // ── Alert card ───────────────────────────────────────────
  const renderAlertItem = ({ item: alert, index }) => {
    const severity   = (alert.severity || 'medium').toLowerCase();
    const color      = getSeverityColor(severity);
    const fraudTypes = alert.type || 'unknown';
    const timeAgo    = getTimeAgo(alert.time || alert.timestamp || alert.createdAt);
    const tagList    = fraudTypes.split(',').map(t => t.trim()).filter(Boolean);

    return (
      <View style={[styles.alertCard, { borderLeftColor: color }, alert.resolved && styles.alertResolved]}>

        {/* Header */}
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <View style={[styles.alertIconCircle, { backgroundColor: color + '20' }]}>
              <Icon name={getAlertIcon(fraudTypes)} size={20} color={color} />
            </View>
            <View style={styles.alertTitleInfo}>
              <Text style={styles.alertBatchId} numberOfLines={1}>
                {alert.batchId || 'Unknown Batch'}
              </Text>
              {alert.product
                ? <Text style={styles.alertProduct}>{alert.product}</Text>
                : null}
            </View>
          </View>

          {alert.resolved ? (
            <View style={styles.resolvedBadge}>
              <Icon name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.resolvedText}>Resolved</Text>
            </View>
          ) : (
            <View style={[styles.severityBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.severityText, { color }]}>{severity.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Fraud type tags */}
        <View style={styles.tagRow}>
          {tagList.map((tag, i) => (
            <View
              key={`${alert._id || index}-tag-${i}-${tag}`}
              style={[styles.fraudTag, { borderColor: color }]}
            >
              <Text style={[styles.fraudTagText, { color }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Message */}
        {alert.message
          ? <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
          : null}

        {/* Footer */}
        <View style={styles.alertFooter}>
          <View style={styles.alertTimeRow}>
            <Icon name="schedule" size={12} color="#999" />
            <Text style={styles.alertTime}>{timeAgo}</Text>
          </View>
          {alert.fraudProbability != null && (
            <Text style={styles.probText}>
              Score: {(alert.fraudProbability * 100).toFixed(0)}%
            </Text>
          )}
        </View>

        {/* Resolve button */}
        {!alert.resolved && (
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={[styles.resolveBtn, { backgroundColor: color }]}
              onPress={() => handleResolve(alert._id)}
            >
              <Icon name="gavel" size={14} color="#fff" />
              <Text style={styles.resolveBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ── Pending approval card ────────────────────────────────
  const renderPendingItem = ({ item: batch }) => (
    <View style={styles.pendingCard}>
      <Text style={styles.batchId}>{batch.batchId}</Text>
      <Text style={styles.batchText}>{batch.productType}</Text>
      <View style={styles.pendingActions}>
        <TouchableOpacity
          style={[styles.pendingBtn, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleApprove(batch.batchId)}
        >
          <Icon name="check-circle" size={14} color="#fff" />
          <Text style={styles.pendingBtnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pendingBtn, { backgroundColor: '#F44336' }]}
          onPress={() => handleReject(batch.batchId)}
        >
          <Icon name="cancel" size={14} color="#fff" />
          <Text style={styles.pendingBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Batch card ───────────────────────────────────────────
  const renderBatchItem = ({ item: batch, index }) => (
    <TouchableOpacity
      style={styles.batchCard}
      onPress={() => navigation.navigate('BatchDetails', { batch })}
    >
      <View style={styles.batchHeader}>
        <Text style={styles.batchId}>{batch.batchId}</Text>
        {batch.hasIssues && <Icon name="warning" size={18} color="#F57C00" />}
      </View>
      <View style={styles.batchInfo}>
        <View style={styles.batchRow}>
          <Icon name="category" size={14} color="#888" />
          <Text style={styles.batchText}>{batch.productType}</Text>
        </View>
        <View style={styles.batchRow}>
          <Icon name="agriculture" size={14} color="#888" />
          <Text style={styles.batchText}>{batch.producer || batch.producerEmail || 'Unknown'}</Text>
        </View>
        <View style={styles.batchRow}>
          <Icon name="timeline" size={14} color="#888" />
          <Text style={styles.batchText}>{batch.checkpoints || 0} checkpoints</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Tab content renderer ─────────────────────────────────
  const renderTabContent = () => {
    if (activeTab === 'alerts') {
      return (
        <FlatList
          data={activeAlerts}
          keyExtractor={(item, index) => `alert-${item._id || index}-${index}`}
          renderItem={renderAlertItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} colors={['#366d80']} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyState}>
                <Icon name="check-circle" size={64} color="#4CAF50" />
                <Text style={styles.emptyTitle}>All Clear</Text>
                <Text style={styles.emptyText}>No active fraud alerts detected</Text>
                <TouchableOpacity style={styles.scanButton} onPress={loadData}>
                  <Icon name="search" size={18} color="#fff" />
                  <Text style={styles.scanButtonText}>Run AI Scan</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      );
    }

    if (activeTab === 'pending') {
      return (
        <FlatList
          data={pendingBatches}
          keyExtractor={(item, index) => `pending-${item.batchId || item._id || index}`}
          renderItem={renderPendingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} colors={['#366d80']} />
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.emptyState}>
                <Icon name="hourglass-empty" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Pending Approvals</Text>
                <Text style={styles.emptyText}>All batches have been reviewed</Text>
              </View>
            )
          }
        />
      );
    }

    // batches tab
    return (
      <FlatList
        data={batches}
        keyExtractor={(item, index) => `batch-${item.batchId || item._id || index}-${index}`}
        renderItem={renderBatchItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} colors={['#366d80']} />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <Icon name="inventory-2" size={64} color="#ddd" />
              <Text style={styles.emptyTitle}>No Batches</Text>
              <Text style={styles.emptyText}>No batches found in the system</Text>
            </View>
          )
        }
      />
    );
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Government Authority</Text>
          <Text style={styles.headerSubtitle}>
            {scanning ? 'Running AI scan...' : 'Monitor & Regulate'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {scanning && (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 12 }} />
          )}
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutButton}>
            <Icon name="logout" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Icon name="error-outline" size={16} color="#fff" />
          <Text style={styles.errorText} numberOfLines={1}>{error}</Text>
          <TouchableOpacity onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {renderStatCard('Total Batches', stats.totalBatches,     'inventory-2',            '#2196F3')}
          {renderStatCard('Active Alerts', stats.activeAlerts,     'notification-important', '#F44336')}
        </View>
        <View style={styles.statsRow}>
          {renderStatCard('Checkpoints',   stats.totalCheckpoints, 'location-on',            '#4CAF50')}
          {renderStatCard('Compliant',     stats.compliantBatches, 'verified',               '#9C27B0')}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
          onPress={() => setActiveTab('alerts')}
        >
          <Icon name="notification-important" size={16}
            color={activeTab === 'alerts' ? '#366d80' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
            Alerts{activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Icon name="hourglass-top" size={16}
            color={activeTab === 'pending' ? '#366d80' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending{pendingBatches.length > 0 ? ` (${pendingBatches.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'batches' && styles.tabActive]}
          onPress={() => setActiveTab('batches')}
        >
          <Icon name="inventory-2" size={16}
            color={activeTab === 'batches' ? '#366d80' : '#999'} />
          <Text style={[styles.tabText, activeTab === 'batches' && styles.tabTextActive]}>
            Batches ({batches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container      : { flex: 1, backgroundColor: '#f0f4f7' },

  // Header
  header         : { backgroundColor: '#366d80', paddingTop: 48, paddingBottom: 16,
                     paddingHorizontal: 20, flexDirection: 'row',
                     justifyContent: 'space-between', alignItems: 'center' },
  headerTitle    : { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSubtitle : { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerActions  : { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refreshBtn     : { padding: 6 },
  logoutButton   : { padding: 6 },

  // Error
  errorBanner    : { backgroundColor: '#C62828', flexDirection: 'row', alignItems: 'center',
                     gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  errorText      : { color: '#fff', fontSize: 13, flex: 1 },
  retryText      : { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Stats
  statsContainer : { padding: 16, paddingBottom: 8 },
  statsRow       : { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard       : { flex: 1, flexDirection: 'row', backgroundColor: '#fff', padding: 12,
                     borderRadius: 12, borderLeftWidth: 4, alignItems: 'center',
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                     shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statInfo       : { marginLeft: 10 },
  statValue      : { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  statTitle      : { fontSize: 10, color: '#888', marginTop: 1,
                     textTransform: 'uppercase', letterSpacing: 0.4 },

  // Tabs
  tabBar         : { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
                     marginBottom: 8, borderRadius: 12, padding: 4,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                     shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  tab            : { flex: 1, flexDirection: 'row', alignItems: 'center',
                     justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10 },
  tabActive      : { backgroundColor: '#e8f4f8' },
  tabText        : { fontSize: 12, color: '#999', fontWeight: '600' },
  tabTextActive  : { color: '#366d80' },

  listContent    : { padding: 16, paddingTop: 8, paddingBottom: 40 },

  // Alert card
  alertCard      : { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
                     borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                     shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  alertResolved  : { opacity: 0.55 },
  alertHeader    : { flexDirection: 'row', justifyContent: 'space-between',
                     alignItems: 'flex-start', marginBottom: 10 },
  alertTitleRow  : { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertIconCircle: { width: 38, height: 38, borderRadius: 19,
                     alignItems: 'center', justifyContent: 'center' },
  alertTitleInfo : { flex: 1 },
  alertBatchId   : { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  alertProduct   : { fontSize: 12, color: '#888', marginTop: 1 },
  severityBadge  : { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  severityText   : { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  resolvedBadge  : { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resolvedText   : { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  tagRow         : { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  fraudTag       : { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  fraudTagText   : { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  alertMessage   : { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },
  alertFooter    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTimeRow   : { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertTime      : { fontSize: 11, color: '#bbb' },
  probText       : { fontSize: 11, color: '#999', fontWeight: '600' },
  alertActions   : { marginTop: 12 },
  resolveBtn     : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                     gap: 6, paddingVertical: 9, borderRadius: 10 },
  resolveBtnText : { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Pending card
  pendingCard    : { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                     shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  pendingActions : { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 },
  pendingBtn     : { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                     gap: 6, padding: 10, borderRadius: 10 },
  pendingBtnText : { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Batch card
  batchCard      : { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                     shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  batchHeader    : { flexDirection: 'row', justifyContent: 'space-between',
                     alignItems: 'center', marginBottom: 10 },
  batchId        : { fontSize: 15, fontWeight: '700', color: '#366d80' },
  batchInfo      : { gap: 6 },
  batchRow       : { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batchText      : { fontSize: 13, color: '#666' },

  // Empty states
  emptyState     : { alignItems: 'center', paddingVertical: 60 },
  emptyTitle     : { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 14 },
  emptyText      : { fontSize: 14, color: '#aaa', marginTop: 6 },
  scanButton     : { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#366d80',
                     paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  scanButtonText : { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default GovernmentDashboard;