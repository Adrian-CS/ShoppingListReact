import { Alert } from 'react-native';

// Función para mostrar logs
export const showLog = (message, setLogs) => {
  // Actualizar el estado de logs
  setLogs((prevLogs) => [...prevLogs, message]);

  // Mostrar la alerta
  Alert.alert("Log", message);
};
