import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import all screens
import LoginScreen from '../screens/LoginScreen';
import ProducerDashboard from '../screens/ProducerDashboard';
import DistributorDashboard from '../screens/DistributorDashboard';
import GovernmentDashboard from '../screens/GovernmentDashboard';
import ConsumerScreen from '../screens/ConsumerScreen';
import BatchDetailsScreen from '../screens/BatchDetailsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#366d80ff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProducerDashboard" 
        component={ProducerDashboard}
        options={{ title: 'Producer Dashboard', headerLeft: null }}
      />
      <Stack.Screen 
        name="DistributorDashboard" 
        component={DistributorDashboard}
        options={{ title: 'Distributor Dashboard', headerLeft: null }}
      />
      <Stack.Screen 
        name="GovernmentDashboard" 
        component={GovernmentDashboard}
        options={{ title: 'Government Authority', headerLeft: null }}
      />
      <Stack.Screen 
        name="ConsumerScreen" 
        component={ConsumerScreen}
        options={{ title: 'Verify Product', headerLeft: null }}
      />
      <Stack.Screen 
        name="BatchDetails" 
        component={BatchDetailsScreen}
        options={{ title: 'Batch Journey' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;