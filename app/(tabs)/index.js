import {
  Alert,
  Image,
  StyleSheet,
  Platform,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  ImageBackground,
} from "react-native";
import { Icon } from "@rneui/themed";
import { ThemedText } from "@/components/ThemedText";
import {
  FlatList,
  GestureHandlerRootView,
  ScrollView,
  TextInput,
} from "react-native-gesture-handler";
import DraggableFlatList, {
  ScaleDecorator,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';
import { useEffect, useRef, useState } from "react";
import TaskItem from "../../components/TaskItem";
import * as SQLite from "expo-sqlite";
import { SelectList } from 'react-native-dropdown-select-list'
import { useListContext } from '../../components/ListContext'; 
//import { Text, View } from 'react-native-reanimated/lib/typescript/Animated';
const image = {
  uri: "https://i.pinimg.com/736x/5d/f1/35/5df1359a55fa8ec26509c0dfb10082e4.jpg",
};

export default function HomeScreen() {
  //Auxiliar stuff
  const showLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Guardamos los logs en el estado
    Alert.alert("Log", message); // Muestra la alerta con el mensaje
  };
  //Para debugear, vemos las tasks en bbdd
  const showTasksInAlert = () => {
    const taskList = tasks.map((task) => task.text).join(", ");
    Alert.alert("Tasks list", `Current Tasks: ${taskList}`);
  };
  let inputRef = useRef(null);

  const showKeyboard = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  //UseStates
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIdEditing] = useState(null);
  const [activeList, setActiveList] = useState(null); // Lista activa
  const [activeListUser, setActiveListUser] = useState(null); // Lista activa
  const { lists, isLoading, loadLists, data, primaryList, LoadDataForSelectListWithoutPrimary } = useListContext(); 
  const [logs, setLogs] = useState([]);
  
  //Data base stuff
  const db = SQLite.openDatabaseSync("kaimonolist.db"); // Abre (o crea) la base de datos
  useEffect(() => {
    loadLists();
  }, []);

  // Si `primaryList` cambia, establecerla como la lista activa
  useEffect(() => {
    //showLog(`La id es: ${primaryList}`)
    if (primaryList) {
      setActiveList(primaryList.id);  // Establecer la lista principal como la activa
    }
  }, [primaryList]);
  // Este useEffect se ejecuta cada vez que activeList cambie
  useEffect(() => {
    if (activeListUser !== null) {
      // Si hay una lista seleccionada, cargar las tareas correspondientes a esa lista
      const result = db.getAllSync("select * from tasks where list_id = ? order by sortOrder asc", [activeListUser]);
      setTasks(result); // Actualizar las tareas con las de la lista seleccionada
      //showLog(`${activeListUser}`)
    }
  }, [activeListUser]);
    // Nueva función para manejar el reordenamiento
  const handleDragEnd = ({ data }) => {
    // Verificar que hay una lista activa
    if (!activeList && !activeListUser) {
      showLog("No active list selected");
      return;
    }
    
    // Obtener la lista actual
    const currentListId = activeListUser !== null ? activeListUser : activeList;
    
    // Convertir a string para comparación consistente
    const currentListIdStr = currentListId.toString();
    
    // Verificar que todas las tareas pertenecen a la lista actual
    const allTasksBelongToCurrentList = data.every(task => task.list_id.toString() === currentListIdStr);
    
    if (!allTasksBelongToCurrentList) {
      showLog("Error: Tasks from different lists detected");
      // Debug: mostrar los IDs para verificar
      console.log("Current list ID:", currentListIdStr);
      console.log("Task list IDs:", data.map(task => task.list_id.toString()));
      return;
    }
    
    // Actualizar el estado local
    setTasks(data);
    
    // Actualizar la base de datos con el nuevo orden
    data.forEach((task, index) => {
      db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ? AND list_id = ?", [
        index, 
        task.id, 
        currentListId // Mantener el tipo original para la query
      ]);
    });
  };
  function handleDeleteTask(id) {
    // Verificar que hay una lista activa
    if (!activeList && !activeListUser) {
      showLog("Select a list");
      return;
    }
    
    // Obtener la lista actual
    const currentListId = activeListUser !== undefined ? activeListUser : activeList;
    
    Alert.alert(
      "削除",
      "削除よろしいでしょうか",
      [
        { text: "いいえ" },
        {
          text: "はい",
          onPress: () => {
            // Verificar que la tarea pertenece a la lista activa
            const task = tasks.find((task) => task.id === id);
            if (!task || task.list_id.toString() !== currentListId.toString()) {
              showLog("Task does not belong to the selected list.");
              return;
            }
            
            // Eliminar la tarea de la base de datos
            const result = db.runSync("delete from tasks where id = ? and list_id = ?;", [id, currentListId]);
            
            if (result.changes > 0) {
              // Filtrar las tareas eliminadas del estado local
              const updatedTasks = tasks.filter((task) => task.id !== id);
              
              // Reordenar los sortOrder para que sean consecutivos (solo para la lista actual)
              updatedTasks.forEach((task, index) => {
                db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ? AND list_id = ?", [index, task.id, currentListId]);
              });
              
              // Actualizar el estado
              setTasks(updatedTasks);
            } else {
              showLog("Error deleting task");
            }
          },
        },
      ]
    );
  }

  function handleEditTask(item) {
    setTaskText(item.text);
    setIdEditing(item.id);
    showKeyboard();
  }

  function handleSaveTask() {
    if (!taskText.trim()) return;
    if (!activeList && !activeListUser) {
      showLog("Select a list");
      return;
    }
    const actualList = activeListUser !== undefined ? activeListUser : activeList;
    
    if (isEditing) {
      const taskId = Number(isEditing);
      if (isNaN(taskId)) {
        showLog("Invalid task ID");
        return;
      }
      
      const result = db.runSync("update tasks set text = ? where id = ? and list_id = ?", [
        taskText,
        taskId,
        actualList,
      ]);

      if (result.changes > 0) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, text: taskText } : task
          )
        );
        setIdEditing(null);
      } else {
        showLog("Error editing task");
      }
      Keyboard.dismiss();
    } else {
      // Obtener el máximo sortOrder para la lista actual
      const maxSortOrderResult = db.getAllSync("SELECT MAX(sortOrder) as maxOrder FROM tasks WHERE list_id = ?", [actualList]);
      const nextSortOrder = (maxSortOrderResult[0]?.maxOrder || -1) + 1;
      
      const result = db.runSync("insert into tasks (text, list_id, sortOrder) values (?, ?, ?);", [
        taskText,
        actualList,
        nextSortOrder
      ]);
      
      const newTask = { 
        id: result.lastInsertRowId, 
        text: taskText, 
        list_id: actualList,
        sortOrder: nextSortOrder,
        isCrossed: false
      };
      setTasks([...tasks, newTask]);
      Keyboard.dismiss();
    }
    setTaskText("");
  }
  function handleDoneTask(id, isCrossed) {
      const crossed = !isCrossed;
      const result = db.runSync("update tasks set isCrossed = ? where id = ?", [
        crossed,
        id,
      ]);

      if (result.changes > 0) {
        // Actualizar el estado de las tareas en la UI
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === id ? { ...task, isCrossed: crossed } : task
          )
        );
      } else {
        showLog("Error crossing task");
      }
  }
const renderTask = ({ item, drag, isActive }) => {
  return (
    <ScaleDecorator>
      <OpacityDecorator>
        <TaskItem
          item={item}
          handleEdit={handleEditTask}
          handleDelete={handleDeleteTask}
          handleDoneTask={handleDoneTask}
          drag={drag}           // Pasar la función drag
          isActive={isActive}   // Pasar el estado isActive
        />
      </OpacityDecorator>
    </ScaleDecorator>
  );
};

  return (
    <GestureHandlerRootView style={styles.container}>
      <ImageBackground
        source={image}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
      <View style={styles.overlay}>
        <ThemedText style={styles.titlegeneral}>リスト</ThemedText>
          <SelectList 
              setSelected={(val) => setActiveListUser(val)} 
              data={data} 
              save="key"
              boxStyles={styles.menuContainer}
              dropdownItemStyles={styles.menuItem}
              dropdownStyles={styles.menuContainer}
              defaultOption={{ key: activeList, value: lists.find(list => list.id === activeList)?.name }}  // Establece la opción por defecto
          />
          <TextInput
            ref={inputRef}
            placeholder="なんか書いて"
            style={styles.inputTask}
            onChangeText={setTaskText}
            value={taskText}
            onSubmitEditing={handleSaveTask}
          ></TextInput>
          <View style={styles.addButtonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={handleSaveTask}>
              <Text style={styles.addText}>{isEditing ? "Edit" : "入力"}</Text>
              <Icon name="done" color="red"></Icon>
            </TouchableOpacity>
          </View>
          <DraggableFlatList
            data={tasks}
            onDragEnd={handleDragEnd}
            renderItem={renderTask}
            keyExtractor={(item) => item.id.toString()}
            style={styles.flatList}
          />
        </View>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //padding: 40,
    marginTop: 35,
    //justifyContent: "center",
  },
  addButtonContainer: {
    backgroundColor: "green",
    width: "30%",
    flexDirection: "row",
    justifyContent: "center",
    borderRadius: 20,
  },
  addText: {
    color: "white",
    marginLeft: 10,
  },
  titlegeneral: {
    color: "white",
    fontSize: 22,
    marginBottom: 3,
    marginTop: 5,
    textAlign: "center",
  },
  inputTask: {
    backgroundColor: "white",
    borderRadius: 6,
    margin: 10,
    marginLeft: 2,
    borderColor: "blue",
    borderWidth: 1,
    padding: 10,
  },
  addButton: {
    //backgroundColor: 'purple',
    width: 80,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  task: {
    //flexDirection: "row",
    //justifyContent: "space-between",
    //alignItems: "center",
    //marginBottom: 20,
    padding: 20,
    backgroundColor: "#f9c2ff",
    borderRadius: 5,
  },
  taskText: {
    maxWidth: "80%",
  },
  buttonContainer: {
    flexDirection: "row",
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
  },
  flatList: {
    marginTop: 10,
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  menuContainer: {
    backgroundColor: 'white',
  },
  selectListButton: {
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#6200ea", // Color de fondo para el botón
    borderRadius: 4,
  },
  menuItem: {
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});