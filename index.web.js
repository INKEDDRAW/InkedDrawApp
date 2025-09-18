import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('InkedDrawApp', () => App);
AppRegistry.runApplication('InkedDrawApp', {
    rootTag: document.getElementById('root')
});
