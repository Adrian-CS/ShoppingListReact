import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, Alert, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useListContext } from '../../components/ListContext';  // Importar el contexto

// Abre la base de datos
const db = SQLite.openDatabaseSync("kaimonolist.db");

const ListManager = () => {
  const { lists, loadLists, saveList, deleteList } = useListContext();  // Consumir el contexto
  const [listName, setListName] = useState('');
  const [isEditingList, setIsEditingList] = useState(null);

  // Cargar las listas desde la base de datos cuando el componente se monta
  useEffect(() => {
    db.execSync("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)");
    loadLists();  // Cargar las listas
  }, []);

  // Función para crear o editar una lista
  const handleSaveList = () => {
    saveList(listName, isEditingList, setIsEditingList);
    setListName('');  // Limpiar el campo de texto
  };

  // Función para activar el modo de edición
  const handleEditList = (id, name) => {
    setIsEditingList(id);
    setListName(name);
  };

  // Función para eliminar una lista
  const handleDeleteList = (id) => {
    Alert.alert(
      "Eliminar Lista",
      "¿Estás seguro de que quieres eliminar esta lista?",
      [
        { text: "Cancelar" },
        {
          text: "Eliminar",
          onPress: () => {
            deleteList(id);  // Eliminar la lista desde la base de datos
          },
        },
      ]
    );
  };

  // Función para renderizar cada lista en el FlatList
  const renderList = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listText}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleEditList(item.id, item.name)}>
        <Text style={styles.editText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteList(item.id)}>
        <Text style={styles.deleteText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nombre de la lista"
        value={listName}
        onChangeText={setListName}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveList}>
        <Text style={styles.saveButtonText}>{isEditingList !== null ? "Editar Lista" : "Crear Lista"}</Text>
      </TouchableOpacity>

      <FlatList
        data={lists}
        renderItem={renderList}
        keyExtractor={(item) => item.id.toString()}
        style={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 35,
    backgroundColor: 'white',
  },
  input: {
    height: 40,
    borderColor: 'grey',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
  },
  listContainer: {
    marginTop: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 6,
  },
  listText: {
    fontSize: 16,
  },
  editText: {
    color: 'blue',
    marginRight: 10,
  },
  deleteText: {
    color: 'red',
  },
});

export default ListManager;
