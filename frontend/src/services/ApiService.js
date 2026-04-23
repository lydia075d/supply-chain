import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "./config";

// ── Token helpers ────────────────────────────────────────────────────────────

const getToken = async () => {
  try {
    return await AsyncStorage.getItem("authToken");
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

const authHeaders = async (isJson = true) => {
  const token = await getToken();

  if (!token) {
    console.log("❌ NO TOKEN FOUND");
    throw new Error("No token found");
  }

  return {
    ...(isJson && { "Content-Type": "application/json" }),
    Authorization: `Bearer ${token}`,
  };
};

// ── Safe JSON parser / error handler ────────────────────────────────────────

const safeJson = async (res) => {
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Invalid JSON response:", text);
    throw new Error("Invalid server response");
  }

  if (!res.ok) {
    console.log("❌ API ERROR:", res.status, data);

    if (res.status === 401) {
      await AsyncStorage.removeItem("authToken");
      throw new Error("Session expired. Please login again.");
    }

    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
};

// ── ApiService ───────────────────────────────────────────────────────────────

const ApiService = {

  // ── Auth helpers (class version) ─────────────────────────────────────────

  /** Save auth token to storage */
  setAuthToken: async (token) => {
    try {
      await AsyncStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  },

  // ── Auth ─────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return safeJson(res);
  },

  register: async (email, password, role) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    return safeJson(res);
  },

  // ── Producer ─────────────────────────────────────────────────────────────

  createBatch: async (batchData) => {
    const headers = await authHeaders();
    const url = `${API_BASE_URL}/batch/create`;
    console.log("CREATE BATCH URL:", url);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(batchData),
    });
    return safeJson(res);
  },

  getProducerBatches: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/batch/producer/batches`, { headers });
    return safeJson(res);
  },

  // ── Distributor ──────────────────────────────────────────────────────────

  recordCheckpoint: async (checkpointData) => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/checkpoint`, {
      method: "POST",
      headers,
      body: JSON.stringify(checkpointData),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Checkpoint failed");
    return data;
  },

  getDistributorCheckpoints: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/checkpoint/recent`, { headers });
    return safeJson(res);
  },

  // ── Retail ───────────────────────────────────────────────────────────────

  dispatchToRetailers: async (payload) => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/retail/dispatch`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Dispatch failed");
    return data;
  },

  getRetailerStock: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/retail/my-stock`, { headers });
    const data = await safeJson(res);
    return Array.isArray(data) ? data : [];
  },

  confirmRetailReceipt: async (retailBatchId, location) => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/retail/${retailBatchId}/receive`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ location }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Receipt confirmation failed");
    return data;
  },

  updateRetailStatus: async (retailBatchId, status, quantityRemaining) => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/retail/${retailBatchId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status, quantityRemaining }),
    });
    return safeJson(res);
  },

  getRetailerStats: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/retail/stats`, { headers });
    return safeJson(res);
  },

  getDistributorDispatches: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/retail/distributor/dispatches`, { headers });
    return safeJson(res);
  },

  // ── Government ───────────────────────────────────────────────────────────

  /** Fetch all batches via government endpoint */
  getAllBatches: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/government/batches`, { headers });
    return safeJson(res);
  },

  /** Fetch fraud alerts with optional level / status filters */
  getFraudAlerts: async (level = "", status = "") => {
    const headers = await authHeaders(false);
    const params = new URLSearchParams();
    if (level)  params.append("level", level);
    if (status) params.append("status", status);
    const res = await fetch(`${API_BASE_URL}/government/alerts?${params}`, { headers });
    return safeJson(res);
  },

  /** Alias used by teammate's dashboard — same endpoint as getFraudAlerts */
  getAlerts: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/government/alerts`, { headers });
    return safeJson(res);
  },

  /**
   * Triggers Python AI /scan-all → writes fraud alerts to MongoDB → returns fresh alerts.
   * Returns { scanned: true, alerts: [...] }
   */
  triggerScanAndGetAlerts: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/government/scan`, {
      method: "POST",
      headers,
    });
    return safeJson(res);
  },

  /** Resolve a single alert by ID */
  resolveAlert: async (alertId) => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/government/alerts/${alertId}/resolve`, {
      method: "PATCH",
      headers,
    });
    return safeJson(res);
  },

  /** Approve a batch (government authority) */
  approveBatch: async (batchId) => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/government/approve/${batchId}`, {
      method: "PATCH",
      headers,
    });
    return safeJson(res);
  },

  /** Reject a batch (government authority) */
  rejectBatch: async (batchId) => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/government/reject/${batchId}`, {
      method: "PATCH",
      headers,
    });
    return safeJson(res);
  },

  // ── Batch lookup ─────────────────────────────────────────────────────────

  getBatchById: async (batchId) => {
    const res = await fetch(`${API_BASE_URL}/batch/batchId/${batchId}`);
    return safeJson(res);
  },

  getBatchFraudInfo: async (batchId) => {
    const res = await fetch(`${API_BASE_URL}/batch/batches/${batchId}/fraud`);
    return safeJson(res);
  },

  // ── Consumer ─────────────────────────────────────────────────────────────

  /** Verify a batch by ID (public, no auth required) */
  verifyBatch: async (batchId) => {
    const res = await fetch(`${API_BASE_URL}/verify/${batchId}`);
    return safeJson(res);
  },

  /** Get full batch details (public, no auth required) */
  getBatchDetails: async (batchId) => {
    const res = await fetch(`${API_BASE_URL}/batch/batchId/${batchId}`);
    return safeJson(res);
  },

  // ── AI / Fraud ───────────────────────────────────────────────────────────

  /** Trigger a fraud scan for a specific batch */
  triggerFraudScan: async (batchId) => {
    const headers = await authHeaders();
    const res = await fetch(`${API_BASE_URL}/ai/predict`, {
      method: "POST",
      headers,
      body: JSON.stringify({ batchId }),
    });
    return safeJson(res);
  },

  /** Get alert summary stats */
  getAlertSummary: async () => {
    const headers = await authHeaders(false);
    const res = await fetch(`${API_BASE_URL}/alerts/summary`, { headers });
    return safeJson(res);
  },
};

export default ApiService;