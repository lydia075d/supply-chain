import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Change this to your actual backend URL ─────────────
const BASE_URL = 'http://192.168.1.100:3000/api';  // update with your IP

const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

const authHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type' : 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const ApiService = {

  // ════════════════════════════════════════════════════
  //  YOUR EXISTING METHODS — DO NOT CHANGE
  // ════════════════════════════════════════════════════

  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email, password }),
    });
    return res.json();
  },

  register: async (email, password, role) => {
    const res = await fetch(`${BASE_URL}/register`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ email, password, role }),
    });
    return res.json();
  },

  createBatch: async (batchData) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/create`, {
      method : 'POST',
      headers,
      body   : JSON.stringify(batchData),
    });
    return res.json();
  },

  getProducerBatches: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/producer/batches`, { headers });
    return res.json();
  },

  getBatchById: async (batchId) => {
    const res = await fetch(`${BASE_URL}/batchId/${batchId}`);
    return res.json();
  },

  recordCheckpoint: async (checkpointData) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/checkpoints`, {
      method : 'POST',
      headers,
      body   : JSON.stringify(checkpointData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Checkpoint failed');
    }
    return res.json();
  },

  getDistributorCheckpoints: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/checkpoints/recent`, { headers });
    return res.json();
  },


  // ════════════════════════════════════════════════════
  //  NEW — RETAILER METHODS
  // ════════════════════════════════════════════════════

  // Distributor dispatches a batch to multiple retailers
  dispatchToRetailers: async (payload) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/retail/dispatch`, {
      method : 'POST',
      headers,
      body   : JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Dispatch failed');
    }
    return res.json();
  },

  // Retailer gets their assigned stock
  getRetailerStock: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/retail/my-stock`, { headers });
    return res.json();
  },

  // Retailer confirms receipt of a batch
  confirmRetailReceipt: async (retailBatchId, location) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/retail/${retailBatchId}/receive`, {
      method : 'PATCH',
      headers,
      body   : JSON.stringify({ location }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Receipt confirmation failed');
    }
    return res.json();
  },

  // Update retail batch status (On Shelf / Sold Out)
  updateRetailStatus: async (retailBatchId, status, quantityRemaining) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/retail/${retailBatchId}/status`, {
      method : 'PATCH',
      headers,
      body   : JSON.stringify({ status, quantityRemaining }),
    });
    return res.json();
  },

  // Get retailer dashboard stats
  getRetailerStats: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/retail/stats`, { headers });
    return res.json();
  },

  // Get distributor's outgoing dispatches
  getDistributorDispatches: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/retail/distributor/dispatches`, { headers });
    return res.json();
  },


  // ════════════════════════════════════════════════════
  //  NEW — AI / FRAUD ALERT METHODS
  // ════════════════════════════════════════════════════

  // Get all fraud alerts (for government / admin dashboard)
  getFraudAlerts: async (level = '', status = '') => {
    const headers = await authHeaders();
    const params  = new URLSearchParams();
    if (level)  params.append('level', level);
    if (status) params.append('status', status);
    const res = await fetch(`${BASE_URL}/alerts?${params}`, { headers });
    return res.json();
  },

  // Get alert summary counts
  getAlertSummary: async () => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/alerts/summary`, { headers });
    return res.json();
  },

  // Resolve an alert
  resolveAlert: async (alertId) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/alerts/${alertId}/resolve`, {
      method: 'PATCH',
      headers,
    });
    return res.json();
  },

  // Get fraud info for a specific batch
  getBatchFraudInfo: async (batchId) => {
    const res = await fetch(`${BASE_URL}/batches/${batchId}/fraud`);
    return res.json();
  },

  // Manually trigger AI fraud scan on a batch
  triggerFraudScan: async (batchId) => {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}/ai/predict`, {
      method : 'POST',
      headers,
      body   : JSON.stringify({ batchId }),
    });
    return res.json();
  },

};

export default ApiService;