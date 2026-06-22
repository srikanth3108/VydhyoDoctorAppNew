/**
 * @format
 */

// Add Buffer polyfill for React Native
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux'; 
import App from './App';
import { name as appName } from './app.json';
import store from './src/store/store';


const AppWithProvider = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

AppRegistry.registerComponent(appName, () =>  AppWithProvider);
