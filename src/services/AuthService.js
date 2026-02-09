import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:3000';

class AuthService {
  async register(email, password, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Save token
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userEmail', email);

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      
      // Save token
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('userRole', data.role);
      await AsyncStorage.setItem('userEmail', email);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser() {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const role = await AsyncStorage.getItem('userRole');
      const token = await AsyncStorage.getItem('authToken');

      if (!email || !role || !token) {
        return null;
      }

      return { email, role, token };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export default AuthService;