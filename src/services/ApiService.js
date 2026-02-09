import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:3000'; 

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
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/batch/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(batchData),
      });

      if (!response.ok) {
        throw new Error('Failed to create batch');
      }

      return await response.json();
    } catch (error) {
      console.error('Create batch error:', error);
      throw error;
    }
  }

  async getProducerBatches() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/producer/batches`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      return await response.json();
    } catch (error) {
      console.error('Get batches error:', error);
      return null; 
    }
  }

  // Distributor APIs
  async recordCheckpoint(checkpointData) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/checkpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(checkpointData),
      });

      if (!response.ok) {
        throw new Error('Failed to record checkpoint');
      }

      return await response.json();
    } catch (error) {
      console.error('Record checkpoint error:', error);
      throw error;
    }
  }

  // Government APIs
  async getAllBatches() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/government/batches`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      return await response.json();
    } catch (error) {
      console.error('Get all batches error:', error);
      return null;
    }
  }

  async getAlerts() {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/government/alerts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      return await response.json();
    } catch (error) {
      console.error('Get alerts error:', error);
      return null;
    }
  }

  // Consumer APIs
  async verifyBatch(batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/verify/${batchId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to verify batch');
      }

      return await response.json();
    } catch (error) {
      console.error('Verify batch error:', error);
      throw error;
    }
  }

  async getBatchDetails(batchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/batch/${batchId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch details');
      }

      return await response.json();
    } catch (error) {
      console.error('Get batch details error:', error);
      throw error;
    }
  }
}

export default ApiService;