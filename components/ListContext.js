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
  const [primaryList, setPrimaryList] = useState(null);  // Lista principal
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
    db.execSync(`
      CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        is_primary BOOLEAN DEFAULT 0
      );
    `);    
    db.execSync("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, list_id INTEGER, FOREIGN KEY (list_id) REFERENCES lists(id));");
    // Agregar la columna si no existe
    const res = db.getAllSync(`PRAGMA table_info(tasks);`);
    const columnExists = res.some(col => col.name === 'isCrossed');
    if (!columnExists) {
      db.execSync("ALTER TABLE tasks ADD COLUMN isCrossed BOOLEAN DEFAULT false;");
    }
    const sortOrderExists = res.some(col => col.name === 'sortOrder');
    
    if (!sortOrderExists) {
      db.execSync("ALTER TABLE tasks ADD COLUMN sortOrder INTEGER DEFAULT 0;");
      
      // Asignar orden inicial a tareas existentes, agrupadas por lista
      const allLists = db.getAllSync("SELECT DISTINCT list_id FROM tasks WHERE list_id IS NOT NULL");
      
      allLists.forEach(listRow => {
        // Obtener todas las tareas de esta lista específica
        const tasksInList = db.getAllSync("SELECT * FROM tasks WHERE list_id = ? ORDER BY id ASC", [listRow.list_id]);
        
        // Asignar sortOrder comenzando desde 0 para cada lista
        tasksInList.forEach((task, index) => {
          db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ?", [index, task.id]);
        });
      });
    }
/*           // Manejar tareas que no tienen list_id (si las hay)
      const tasksWithoutList = db.getAllSync("SELECT * FROM tasks WHERE list_id IS NULL ORDER BY id ASC");
      tasksWithoutList.forEach((task, index) => {
        db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ?", [index, task.id]);
    }); */

    const result = db.getAllSync("SELECT * FROM lists");
    //setLists(result); // Guardar las listas en el estado
    // Asegúrate de convertir `is_primary` a un valor booleano
    const transformedLists = result.map((list) => ({
      ...list,
      is_primary: list.is_primary === 1,  // Convertir `is_primary` a booleano
    }));

    // Establecer las listas en el estado
    setLists(transformedLists);
        // Establecer la lista principal
        const primary = transformedLists.find(list => list.is_primary);
        setPrimaryList(primary);
    // Convertir las listas al formato adecuado para el dropdown
    const transformedData = result.map((list) => ({
      key: list.id.toString(),
      value: list.name,
      is_primary: list.is_primary === 1,
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
      data,
      primaryList,
    }}>
      {children}
    </ListContext.Provider>
  );
};
