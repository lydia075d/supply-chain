import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from './config';

const API_URL = API_BASE_URL;

class ApiService {

  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  }

  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async _handleResponse(response) {
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const err = await response.json();
        message = err.message || err.error || message;
      } catch (_) {}
      throw new Error(message);
    }
    return response.json();
  }

  // Producer APIs
  async createBatch(batchData) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_URL}/batch/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(batchData),
    });
    return this._handleResponse(response);
  }

  async getProducerBatches() {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_URL}/batch/producer/batches`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return this._handleResponse(response);
  }

  // Distributor APIs
  async recordCheckpoint(checkpointData) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_URL}/checkpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(checkpointData),
    });
    return this._handleResponse(response);
  }

  // FIX: fetch recent checkpoints for distributor dashboard
  async getDistributorCheckpoints() {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_URL}/checkpoint/recent`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return this._handleResponse(response);
  }

  // Government APIs
  async getAllBatches() {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_URL}/government/batches`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return this._handleResponse(response);
  }

  async getAlerts() {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_URL}/government/alerts`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return this._handleResponse(response);
  }

  // Consumer APIs
  async verifyBatch(batchId) {
    const response = await fetch(`${API_URL}/verify/${batchId}`);
    return this._handleResponse(response);
  }

  // FIX: use batchId string route, not MongoDB _id
  async getBatchDetails(batchId) {
    const response = await fetch(`${API_URL}/batch/batchId/${batchId}`);
    return this._handleResponse(response);
  }
}

export default new ApiService();