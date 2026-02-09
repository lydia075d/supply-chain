import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#2E7D32"
      />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
};

export default App;