import React, { useEffect, useState, useRef } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import store from './src/store';
import initI18n from './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const navigationRef = useRef(null);

  useEffect(() => {
    initI18n().then(() => setIsI18nReady(true));
  }, []);

  if (!isI18nReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator navigationRef={navigationRef} />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
