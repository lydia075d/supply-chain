import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen         from '../screens/LoginScreen';
import ProducerDashboard   from '../screens/ProducerDashboard';
import DistributorDashboard from '../screens/DistributorDashboard';
import RetailerDashboard   from '../screens/RetailerDashboard';   // NEW
import GovernmentDashboard from '../screens/GovernmentDashboard';
import ConsumerScreen      from '../screens/ConsumerScreen';
import BatchDetailsScreen  from '../screens/BatchDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}>

        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="Producer"     component={ProducerDashboard} />
        <Stack.Screen name="Distributor"  component={DistributorDashboard} />
        <Stack.Screen name="Retailer"     component={RetailerDashboard} />   {/* NEW */}
        <Stack.Screen name="Government"   component={GovernmentDashboard} />
        <Stack.Screen name="Consumer"     component={ConsumerScreen} />
        <Stack.Screen name="BatchDetails" component={BatchDetailsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}