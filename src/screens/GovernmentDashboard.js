import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

  const apiService = new ApiService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load from API or use demo data
      const alertsData = await apiService.getAlerts() || getDemoAlerts();
      const batchesData = await apiService.getAllBatches() || getDemoBatches();
      
      setAlerts(alertsData);
      setBatches(batchesData);
      setStats({
        totalBatches: batchesData.length,
        activeAlerts: alertsData.filter(a => !a.resolved).length,
        totalCheckpoints: batchesData.reduce((sum, b) => sum + b.checkpoints, 0),
        compliantBatches: batchesData.filter(b => !b.hasIssues).length,
      });
    } catch (error) {
      // Use demo data
      const alertsData = getDemoAlerts();
      const batchesData = getDemoBatches();
      setAlerts(alertsData);
      setBatches(batchesData);
      setStats({
        totalBatches: batchesData.length,
        activeAlerts: alertsData.filter(a => !a.resolved).length,
        totalCheckpoints: batchesData.reduce((sum, b) => sum + b.checkpoints, 0),
        compliantBatches: batchesData.filter(b => !b.hasIssues).length,
      });
    } finally {
      setLoading(false);
    }
  };

  const getDemoAlerts = () => {
    return [
      {
        id: 1,
        batchId: 'BATCH-003',
        type: 'hoarding',
        severity: 'high',
        message: 'Batch stationary for 72 hours at warehouse',
        timestamp: new Date().toISOString(),
        resolved: false,
      },
      {
        id: 2,
        batchId: 'BATCH-007',
        type: 'scalping',
        severity: 'medium',
        message: 'Rapid movement between multiple locations',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        resolved: false,
      },
      {
        id: 3,
        batchId: 'BATCH-012',
        type: 'fraud',
        severity: 'critical',
        message: 'Impossible velocity detected (150 km/h)',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        resolved: true,
      },
    ];
  };

  const getDemoBatches = () => {
    return [
      {
        batchId: 'BATCH-001',
        productType: 'Organic Rice',
        producer: 'Green Valley Farm',
        quantity: 1000,
        status: 'In Transit',
        checkpoints: 3,
        hasIssues: false,
      },
      {
        batchId: 'BATCH-002',
        productType: 'Fresh Vegetables',
        producer: 'Sunrise Agro',
        quantity: 500,
        status: 'At Warehouse',
        checkpoints: 2,
        hasIssues: false,
      },
      {
        batchId: 'BATCH-003',
        productType: 'Wheat Flour',
        producer: 'Golden Harvest',
        quantity: 2000,
        status: 'At Warehouse',
        checkpoints: 1,
        hasIssues: true,
      },
    ];
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#F57C00';
      case 'medium':
        return '#FBC02D';
      default:
        return '#9E9E9E';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'hoarding':
        return 'hourglass-empty';
      case 'scalping':
        return 'timeline';
      case 'fraud':
        return 'error';
      default:
        return 'warning';
    }
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
    const timeAgo = getTimeAgo(alert.timestamp);

    return (
      <View
        key={alert.id}
        style={[
          styles.alertCard,
          { borderLeftColor: getSeverityColor(alert.severity) },
          alert.resolved && styles.alertResolved,
        ]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <Icon
              name={getAlertIcon(alert.type)}
              size={24}
              color={getSeverityColor(alert.severity)}
            />
            <View style={styles.alertTitleInfo}>
              <Text style={styles.alertBatchId}>{alert.batchId}</Text>
              <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
            </View>
          </View>
          {alert.resolved ? (
            <View style={styles.resolvedBadge}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.resolvedText}>Resolved</Text>
            </View>
          ) : (
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(alert.severity) + '20' },
              ]}>
              <Text
                style={[
                  styles.severityText,
                  { color: getSeverityColor(alert.severity) },
                ]}>
                {alert.severity}
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
      key={batch.batchId}
      style={styles.batchCard}
      onPress={() => navigation.navigate('BatchDetails', { batch })}>
      <View style={styles.batchHeader}>
        <Text style={styles.batchId}>{batch.batchId}</Text>
        {batch.hasIssues && (
          <Icon name="warning" size={20} color="#F57C00" />
        )}
      </View>

      <View style={styles.batchInfo}>
        <View style={styles.batchRow}>
          <Icon name="category" size={16} color="#666" />
          <Text style={styles.batchText}>{batch.productType}</Text>
        </View>
        <View style={styles.batchRow}>
          <Icon name="agriculture" size={16} color="#666" />
          <Text style={styles.batchText}>{batch.producer}</Text>
        </View>
        <View style={styles.batchRow}>
          <Icon name="timeline" size={16} color="#666" />
          <Text style={styles.batchText}>{batch.checkpoints} checkpoints</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Government Authority</Text>
          <Text style={styles.headerSubtitle}>Monitor & Regulate</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }>
        {/* Statistics */}
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

        {/* Active Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {alerts.filter(a => !a.resolved).length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="check-circle" size={60} color="#4CAF50" />
              <Text style={styles.emptyText}>No active alerts</Text>
            </View>
          ) : (
            alerts.filter(a => !a.resolved).map(renderAlertCard)
          )}
        </View>

        {/* Recent Batches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Batches</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {batches.map(renderBatchCard)}
        </View>
      </ScrollView>
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
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
    elevation: 2,
  },
  statInfo: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionLink: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  alertResolved: {
    opacity: 0.6,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertTitleInfo: {
    flex: 1,
  },
  alertBatchId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolvedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  resolveButton: {
    backgroundColor: '#2E7D32',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  batchInfo: {
    gap: 8,
  },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default GovernmentDashboard;