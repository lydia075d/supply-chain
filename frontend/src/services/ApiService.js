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

    return await response.json();
  }

  async getProducerBatches() {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_URL}/batch/producer/batches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
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

    return await response.json();
  }

  // Government APIs
  async getAllBatches() {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_URL}/government/batches`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  }

  async getAlerts() {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_URL}/government/alerts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return await response.json();
  }

  // Consumer APIs
  async verifyBatch(batchId) {

    const response = await fetch(`${API_URL}/verify/${batchId}`);

    return await response.json();
  }

  async getBatchDetails(batchId) {

    const response = await fetch(`${API_URL}/batch/${batchId}`);

    return await response.json();
  }

}

export default new ApiService();