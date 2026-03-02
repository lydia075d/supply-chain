import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "./config";

class ApiService {
  // 🔑 Get Token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem("authToken");
    } catch (error) {
      console.log("Error getting token:", error);
      return null;
    }
  }

  // 💾 Save Token
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  // 🧠 Common Headers
  getHeaders(token, isJson = true) {
    return {
      ...(isJson && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ⚠️ Handle Response
  async handleResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
  }

  // =========================
  // 🧑‍🌾 PRODUCER APIs
  // =========================

  async createBatch(batchData) {
    const token = await this.getAuthToken();
    if (!token) throw new Error("User not logged in");

    const url = `${API_BASE_URL}/batch/create`;
    console.log("CREATE BATCH URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(batchData),
    });

    return this.handleResponse(response);
  }

  async getProducerBatches() {
    const token = await this.getAuthToken();
    if (!token) throw new Error("User not logged in");

    const response = await fetch(`${API_BASE_URL}/batch/producer/batches`, {
      headers: this.getHeaders(token, false),
    });

    return this.handleResponse(response);
  }

  // =========================
  // 🚚 DISTRIBUTOR APIs
  // =========================

  async recordCheckpoint(checkpointData) {
    const token = await this.getAuthToken();
    if (!token) throw new Error("User not logged in");

    const response = await fetch(`${API_BASE_URL}/checkpoint`, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(checkpointData),
    });

    return this.handleResponse(response);
  }

  async getDistributorCheckpoints() {
    const token = await this.getAuthToken();
    if (!token) throw new Error("User not logged in");

    const response = await fetch(`${API_BASE_URL}/checkpoint/recent`, {
      headers: this.getHeaders(token, false),
    });

    return this.handleResponse(response);
  }

  // =========================
  // 🏛 GOVERNMENT APIs
  // =========================

  async getAllBatches() {
    const token = await this.getAuthToken();
    if (!token) throw new Error("User not logged in");

    const response = await fetch(`${API_BASE_URL}/government/batches`, {
      headers: this.getHeaders(token, false),
    });

    return this.handleResponse(response);
  }

  async getAlerts() {
    const token = await this.getAuthToken();
    if (!token) throw new Error("User not logged in");

    const response = await fetch(`${API_BASE_URL}/government/alerts`, {
      headers: this.getHeaders(token, false),
    });

    return this.handleResponse(response);
  }

  // =========================
  // 👤 CONSUMER APIs
  // =========================

  async verifyBatch(batchId) {
    const response = await fetch(`${API_BASE_URL}/verify/${batchId}`);

    return this.handleResponse(response);
  }

  async getBatchDetails(batchId) {
    const response = await fetch(`${API_BASE_URL}/batch/batchId/${batchId}`);

    return this.handleResponse(response);
  }
}

export default new ApiService();
