import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const GovernmentDashboard = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeAlerts: 0,
    totalCheckpoints: 0,
    compliantBatches: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Run both requests in parallel
      const [alertsData, batchesData] = await Promise.all([
        ApiService.getAlerts(),
        ApiService.getAllBatches(),
      ]);

      const alertsList = Array.isArray(alertsData) ? alertsData : [];
      const batchesList = Array.isArray(batchesData) ? batchesData : [];

      setAlerts(alertsList);
      setBatches(batchesList);
      setStats({
        totalBatches: batchesList.length,
        activeAlerts: alertsList.filter(a => !a.resolved).length,
        totalCheckpoints: batchesList.reduce((sum, b) => sum + (b.checkpoints || 0), 0),
        compliantBatches: batchesList.filter(b => !b.hasIssues).length,
      });
    } catch (err) {
      console.error('[Government] Failed to load data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      default: return '#9E9E9E';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'hoarding': return 'hourglass-empty';
      case 'scalping': return 'timeline';
      case 'fraud': return 'error';
      default: return 'warning';
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
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

  const renderAlertCard = (alert) => {
    // Alert model uses 'time' field, not 'timestamp'
    const timeAgo = getTimeAgo(alert.time || alert.timestamp);
    const severity = alert.severity || 'medium';
    const type = alert.type || 'temperature';

    return (
      <View
        key={alert._id || alert.id}
        style={[
          styles.alertCard,
          { borderLeftColor: getSeverityColor(severity) },
          alert.resolved && styles.alertResolved,
        ]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <Icon name={getAlertIcon(type)} size={24} color={getSeverityColor(severity)} />
            <View style={styles.alertTitleInfo}>
              <Text style={styles.alertBatchId}>{alert.batchId || 'Unknown Batch'}</Text>
              <Text style={styles.alertType}>{type.toUpperCase()}</Text>
            </View>
          </View>
          {alert.resolved ? (
            <View style={styles.resolvedBadge}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.resolvedText}>Resolved</Text>
            </View>
          ) : (
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) + '20' }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(severity) }]}>
                {severity}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <Text style={styles.alertTime}>{timeAgo}</Text>
        {!alert.resolved && (
          <TouchableOpacity style={styles.resolveButton}>
            <Text style={styles.resolveButtonText}>Investigate</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderBatchCard = (batch) => (
    <TouchableOpacity
      key={batch.batchId || batch._id}
      style={styles.batchCard}
      onPress={() => navigation.navigate('BatchDetails', { batch })}>
      <View style={styles.batchHeader}>
        <Text style={styles.batchId}>{batch.batchId}</Text>
        {batch.hasIssues && <Icon name="warning" size={20} color="#F57C00" />}
      </View>
      <View style={styles.batchInfo}>
        <View style={styles.batchRow}>
          <Icon name="category" size={16} color="#666" />
          <Text style={styles.batchText}>{batch.productType}</Text>
        </View>
        <View style={styles.batchRow}>
          <Icon name="agriculture" size={16} color="#666" />
          <Text style={styles.batchText}>{batch.producer || batch.producerEmail || 'Unknown'}</Text>
        </View>
        <View style={styles.batchRow}>
          <Icon name="timeline" size={16} color="#666" />
          <Text style={styles.batchText}>{batch.checkpoints || 0} checkpoints</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Government Authority</Text>
          <Text style={styles.headerSubtitle}>Monitor & Regulate</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="error" size={18} color="#fff" />
            <Text style={styles.errorText}>Failed to load: {error}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard('Total Batches', stats.totalBatches, 'inventory-2', '#2196F3')}
            {renderStatCard('Active Alerts', stats.activeAlerts, 'notification-important', '#F44336')}
          </View>
          <View style={styles.statsRow}>
            {renderStatCard('Checkpoints', stats.totalCheckpoints, 'location-on', '#4CAF50')}
            {renderStatCard('Compliant', stats.compliantBatches, 'verified', '#9C27B0')}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
          </View>
          {activeAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={60} color="#4CAF50" />
              <Text style={styles.emptyText}>No active alerts</Text>
            </View>
          ) : (
            activeAlerts.map(renderAlertCard)
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Batches</Text>
          </View>
          {batches.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="inventory-2" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No batches found</Text>
            </View>
          ) : (
            batches.map(renderBatchCard)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#366d80ff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  logoutButton: { padding: 8 },
  errorBanner: { backgroundColor: '#F44336', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, margin: 16, borderRadius: 8 },
  errorText: { color: '#fff', fontSize: 13, flex: 1 },
  statsContainer: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderLeftWidth: 4, alignItems: 'center', elevation: 2 },
  statInfo: { marginLeft: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statTitle: { fontSize: 11, color: '#666', marginTop: 2 },
  section: { padding: 16, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  alertCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
  alertResolved: { opacity: 0.6 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  alertTitleInfo: { flex: 1 },
  alertBatchId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  alertType: { fontSize: 12, color: '#666', marginTop: 2 },
  severityBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  severityText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resolvedText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  alertMessage: { fontSize: 14, color: '#666', marginBottom: 8 },
  alertTime: { fontSize: 12, color: '#999' },
  resolveButton: { backgroundColor: '#366d80ff', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  resolveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  batchCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  batchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  batchId: { fontSize: 16, fontWeight: 'bold', color: '#366d80ff' },
  batchInfo: { gap: 8 },
  batchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  batchText: { fontSize: 14, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
});

export default GovernmentDashboard;