import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#366d80ff"
      />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
};

export default App;