import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AuthService from '../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('producer');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

 
  const roles = [
    { id: 'producer', label: 'Producer/Farmer', icon: 'agriculture' },
    { id: 'distributor', label: 'Distributor/Retailer', icon: 'local-shipping' },
    { id: 'government', label: 'Government Authority', icon: 'security' },
    { id: 'consumer', label: 'Consumer (Verify)', icon: 'shopping-bag' },
  ];

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await AuthService.register(email, password, selectedRole);
      } else {
        await AuthService.login(email, password);
      }
      navigateToDashboard(selectedRole);
    } catch (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    navigateToDashboard(role);
  };

  const navigateToDashboard = (role) => {
    switch (role) {
      case 'producer':
        navigation.replace('ProducerDashboard');
        break;
      case 'distributor':
        navigation.replace('DistributorDashboard');
        break;
      case 'government':
        navigation.replace('GovernmentDashboard');
        break;
      case 'consumer':
        navigation.replace('ConsumerScreen');
        break;
      default:
        navigation.replace('ProducerDashboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="qr-code-scanner" size={80} color="#fff" />
        <Text style={styles.title}>Food Traceability</Text>
        <Text style={styles.subtitle}>Blockchain-Based Supply Chain</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Role Selection */}
          <Text style={styles.roleLabel}>I am a...</Text>
          <View style={styles.rolesContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleButton,
                  selectedRole === role.id && styles.roleButtonSelected,
                ]}
                onPress={() => setSelectedRole(role.id)}>
                <Icon
                  name={role.icon}
                  size={24}
                  color={selectedRole === role.id ? '#fff' : '#366d80ff'}
                />
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === role.id && styles.roleTextSelected,
                  ]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Login/Register Button */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuth}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.authButtonText}>
                {isRegister ? 'Register' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Register */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggleText}>
              {isRegister
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Demo Access */}
          <Text style={styles.demoTitle}>Quick Demo Access</Text>
          <View style={styles.demoButtons}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.demoButton}
                onPress={() => handleDemoLogin(role.id)}>
                <Icon name={role.icon} size={16} color="#366d80ff" />
                <Text style={styles.demoButtonText}>
                  {role.label.split('/')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#366d80ff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },
  rolesContainer: {
    marginBottom: 24,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#366d80ff',
    borderRadius: 8,
    marginBottom: 12,
  },
  roleButtonSelected: {
    backgroundColor: '#366d80ff',
  },
  roleText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#366d80ff',
    fontWeight: '500',
  },
  roleTextSelected: {
    color: '#fff',
  },
  authButton: {
    backgroundColor: '#366d80ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleText: {
    color: '#366d80ff',
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontWeight: '600',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
    width: '48%',
    justifyContent: 'center',
  },
  demoButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#366d80ff',
    fontWeight: '600',
  },
});

export default LoginScreen;