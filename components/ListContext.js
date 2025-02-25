// app/ListContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import Alert from 'react-native'
import * as SQLite from 'expo-sqlite';

// Crear el contexto
const ListContext = createContext();

// Custom hook para usar el contexto
export const useListContext = () => {
  return useContext(ListContext);
};

// Proveedor del contexto
export const ListProvider = ({ children }) => {
  const [lists, setLists] = useState([]);  // Listas de la base de datos
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [isEditingList, setIsEditingList] = useState(null);
  // Conexión con la base de datos SQLite
  const db = SQLite.openDatabaseSync("kaimonolist.db");

  // Crear tablas si no existen
  useEffect(() => {
    db.execSync("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    db.execSync("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, list_id INTEGER, FOREIGN KEY (list_id) REFERENCES lists(id))");
    loadLists(); 
    //loadListsDropdown(); // Cargar las listas cuando el componente se monte
  }, []);

  // Cargar listas desde la base de datos
/*   const loadLists = () => {
    const result = db.getAllSync("SELECT * FROM lists");
    setLists(result);  // Actualizar el estado de las listas
    setIsLoading(false);
  }; */
  // Cargar listas desde la base de datos con formato para el dropdown
  const loadLists = () => {
    db.execSync("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);");
    db.execSync("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, list_id INTEGER, FOREIGN KEY (list_id) REFERENCES lists(id));");

    const result = db.getAllSync("SELECT * FROM lists");
    setLists(result); // Guardar las listas en el estado

    // Convertir las listas al formato adecuado para el dropdown
    const transformedData = result.map((list) => ({
      key: list.id.toString(),
      value: list.name,
      disabled: false,  // Lógica para deshabilitar algunas listas si es necesario
    }));

    setData(transformedData); // Guardar las listas transformadas en 'data'
  };
  // Guardar una nueva lista o editar una lista existente
  const saveList = (listName, isEditingList, setIsEditingList) => {
    //Alert.Alert.alert("Log", isEditingList.toString()); 
    if (isEditingList === null) {
      const result = db.runSync("INSERT INTO lists (name) VALUES (?)", [listName]);
      if (result.changes <= 0) {
        showLog("Error adding list");
      }
    } else {
      db.runSync("UPDATE lists SET name = ? WHERE id = ?", [listName, isEditingList]);
      setIsEditingList(null)
    }
    loadLists();  // Recargar las listas después de guardar
  };

  // Eliminar una lista
  const deleteList = (id) => {
    const identidad = Number(id);
    //Alert.Alert.alert("Log", identidad.toString()); 
    const result = db.runSync("DELETE FROM lists WHERE id = ?", [identidad]);
    if (result.changes <= 0) {
      showLog("Error deleting list");
    }
    loadLists();  // Recargar las listas después de eliminar
  };

  return (
    <ListContext.Provider value={{
      lists,
      isLoading,
      loadLists,
      saveList,
      deleteList,
      data
      //loadListsDropdown
    }}>
      {children}
    </ListContext.Provider>
  );
};
