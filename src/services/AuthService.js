import AsyncStorage from '@react-native-async-storage/async-storage';

import API_BASE_URL from './config';

class AuthService {

  async register(email, password, role) {

    const response = await fetch(
      `${API_BASE_URL}/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      }
    );

    const data = await response.json();

    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('userRole', role);
    await AsyncStorage.setItem('userEmail', email);

    return data;
  }


  async login(email,password){

    const response = await fetch(
      `${API_BASE_URL}/auth/login`,
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('userRole', data.role);
    await AsyncStorage.setItem('userEmail', email);

    return data;
  }


  async logout(){
    await AsyncStorage.clear();
  }

}

export default new AuthService();