import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, Alert, StyleSheet, ImageBackground } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useListContext } from '../../components/ListContext';  // Importar el contexto
import * as Utility from '../../scripts/utility-functions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ThemedText } from "@/components/ThemedText";

// Abre la base de datos
const db = SQLite.openDatabaseSync("kaimonolist.db");

const image = {
  uri: "https://i.pinimg.com/736x/5d/f1/35/5df1359a55fa8ec26509c0dfb10082e4.jpg",
};

const ListManager = () => {
  const { lists, loadLists, saveList, deleteList } = useListContext();  // Consumir el contexto
  const [listName, setListName] = useState('');
  const [isEditingList, setIsEditingList] = useState(null);
  const [logs, setLogs] = useState([]);
  // Cargar las listas desde la base de datos cuando el componente se monta
  useEffect(() => {
    //db.execSync("ALTER TABLE lists ADD is_primary BOOLEAN DEFAULT FALSE")
    db.execSync("CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, is_primary BOOLEAN DEFAULT 0)");
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
      "リスト削除",
      "リスト削除よろしいでしょうか",
      [
        { text: "いいえ" },
        {
          text: "はい",
          onPress: () => {
            deleteList(id);  // Eliminar la lista desde la base de datos
          },
        },
      ]
    );
  };
  // Función para establecer una lista como principal
  const handleSetAsPrimary = (id) => {
    Alert.alert(
      "ディフォルトにします",
      "ディフォルトにしますか？",
      [
        { text: "いいえ" },
        {
          text: "はい",
          onPress: () => {
            setPrimaryList(id);  // Establecer la lista como principal
          },
        },
      ]
    );
  };
  const setPrimaryList = (id) => {
    db.runSync("UPDATE lists SET is_primary = 0");  // Restablecer todas las listas a no principal
    db.runSync("UPDATE lists SET is_primary = 1 WHERE id = ?", [id]);  // Establecer la lista seleccionada como principal
    //Utility.showLog(`${id}`, setLogs);
    loadLists();  // Recargar las listas
  };
  
  // Función para renderizar cada lista en el FlatList
  const renderList = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listText}>{item.name}</Text>
{/*       {item.is_primary && <Text style={styles.primaryText}>ディフォルト</Text>} */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => handleEditList(item.id, item.name)}>
          <Icon name="edit" color="#4caf50" size={24} style={styles.iconMargin} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteList(item.id)}>
          <Icon name="delete" color="red" size={24} style={styles.iconMargin} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSetAsPrimary(item.id)} disabled={item.is_primary}>
        <Icon
            name={item.is_primary ? "star" : "star-border"}  // Si es principal, muestra la estrella llena, si no, estrella vacía
            color={item.is_primary ? "#ff9800" : "#ccc"} // Estilo de color: amarillo para principal, gris para no principal
            size={24}
            style={styles.iconMargin}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
  

  return (
    <View style={styles.container}>
      <ImageBackground
      source={image}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <ThemedText style={styles.titlegeneral}>リスト編集</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="リストの名"
          value={listName}
          onChangeText={setListName}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveList}>
          <Text style={styles.saveButtonText}>{isEditingList !== null ? "編集" : "作る"}</Text>
        </TouchableOpacity>

        <FlatList
          data={lists}
          renderItem={renderList}
          keyExtractor={(item) => item.id.toString()}
          style={styles.listContainer}
        />
      </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //padding: 40,
    marginTop: 35,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  titlegeneral: {
    color: "white",
    fontSize: 22,
    marginBottom: 3,
    marginTop: 5,
    textAlign: "center",
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 12,
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: '#f9f9f9', // Color de fondo más suave para la entrada de texto
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',  // Verde más suave
    paddingVertical: 12,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: 'black',  // Fondo más suave para cada item
    marginBottom: 10,
    borderRadius: 6,
    opacity: 0.7,
    alignItems: 'center',  // Alineación centrada de los elementos
  },
  listText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    flex: 1,
  },
  primaryText: {
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  editText: {
    color: '#2196F3',
    fontSize: 14,
    marginRight: 15,
  },
  deleteText: {
    color: 'red',
    fontSize: 14,
  },
  setPrimaryText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 10,
  },
  disabledText: {
    color: 'grey',
  },
  iconMargin: {
    marginHorizontal: 10,
    marginVertical: 3,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
  },
});

export default ListManager;
