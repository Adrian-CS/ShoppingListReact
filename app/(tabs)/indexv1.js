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
import DraggableFlatList, {
  ScaleDecorator,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';

//import { HelloWave } from '@/components/HelloWave';
//import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from "@/components/ThemedText";
//import { ThemedView } from '@/components/ThemedView';
import {
  FlatList,
  GestureHandlerRootView,
  ScrollView,
  TextInput,
} from "react-native-gesture-handler";
import { useEffect, useRef, useState } from "react";
import TaskItem from "../../components/TaskItem";
import * as SQLite from "expo-sqlite";
import { CheckBox } from 'react-native-elements'
//import { Text, View } from 'react-native-reanimated/lib/typescript/Animated';
const image = {
  uri: "https://i.pinimg.com/736x/5d/f1/35/5df1359a55fa8ec26509c0dfb10082e4.jpg",
};

export default function HomeScreen1() {
  const showLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]); // Guardamos los logs en el estado
    Alert.alert("Log", message); // Muestra la alerta con el mensaje
  };
  //Para debugear, vemos las tasks en bbdd
  const showTasksInAlert = () => {
    const taskList = tasks.map((task) => task.text).join(", ");
    Alert.alert("Tasks list", `Current Tasks: ${taskList}`);
  };
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isEditing, setIdEditing] = useState(null);
  const [byCross, setByCross] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [duplicatesCheck, setDuplicatesCheck] = useState(true);

  let inputRef = useRef(null);

  const showKeyboard = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  //Data base stuff
  const db = SQLite.openDatabaseSync("tasks.db"); // Abre (o crea) la base de datos
    const initializeDatabase = async () => {
    try {
      // Crear tabla con todas las columnas si no existe
      db.execSync(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY NOT NULL,
          text TEXT,
          isCrossed BOOLEAN DEFAULT false,
          sortOrder INTEGER DEFAULT 0
        );
      `);
      // OPTIMIZACIÓN 2: Verificar columnas en una sola consulta
      const tableInfo = db.getAllSync(`PRAGMA table_info(tasks);`);
      const existingColumns = tableInfo.map(col => col.name);
      
      // OPTIMIZACIÓN 3: Agregar columnas en una sola transacción
      db.execSync('BEGIN TRANSACTION;');
      
      if (!existingColumns.includes('isCrossed')) {
        db.execSync("ALTER TABLE tasks ADD COLUMN isCrossed BOOLEAN DEFAULT false;");
      }
      
      if (!existingColumns.includes('sortOrder')) {
        db.execSync("ALTER TABLE tasks ADD COLUMN sortOrder INTEGER DEFAULT 0;");
        
        // OPTIMIZACIÓN 4: Actualizar sortOrder en una sola consulta con ROW_NUMBER
        db.execSync(`
          UPDATE tasks 
          SET sortOrder = (
            SELECT COUNT(*) 
            FROM tasks t2 
            WHERE t2.id <= tasks.id
          ) - 1
          WHERE sortOrder IS NULL OR sortOrder = 0;
        `);
      }
      
      db.execSync('COMMIT;');
      
      // OPTIMIZACIÓN 5: Cargar tareas después de la inicialización
      const result = db.getAllSync("SELECT * FROM tasks ORDER BY sortOrder ASC");
      setTasks(result);
      
    } catch (error) {
      db.execSync('ROLLBACK;');
      showLog(`Database error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    initializeDatabase();
  }, []);
  function handleCrossUncrossAll(cross) {
      const result = db.runSync("update tasks set isCrossed = ? ", [
        cross,
      ]);
      if (result.changes > 0) {
        const updatedTasks = db.getAllSync("select * from tasks order by sortOrder asc");
        setTasks(updatedTasks);
      }
  }
  function handleDeleteTask(id) {
    const result = db.runSync("delete from tasks where id = ?;", [id]);
    
    if (result.changes > 0) {
      if(byCross) {
        const result = db.getAllSync("select * from tasks order by sortOrder asc");
        result.forEach((task, index) => {
          db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ?", [index, task.id]);
        });
        const reorder = db.getAllSync("select * from tasks order by isCrossed asc , sortOrder asc");
        setTasks(reorder);
      } else {
        const updatedTasks = tasks.filter((task) => task.id !== id);
        updatedTasks.forEach((task, index) => {
          db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ?", [index, task.id]);
        });
        setTasks(updatedTasks);
      }
    }
  }
  function handleChangeOrder() {
    if(byCross) {
      const updatedTasks = db.getAllSync("select * from tasks order by sortOrder asc");
      setTasks(updatedTasks);
      setByCross(false);
    } else {
      const updatedTasks = db.getAllSync("select * from tasks order by isCrossed asc , sortOrder asc");
      setTasks(updatedTasks);
      setByCross(true);
    }

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

  function handleEditTask(item) {
    setTaskText(item.text);
    setIdEditing(item.id);
    showKeyboard();
  }
  function handleSaveTask() {
    //showLog(typeof(isEditing));
    //showTasksInAlert();
    if (!taskText.trim()) return;
    const taskId = Number(isEditing); // Asegurarnos de que isEditing es un número
    if (isNaN(taskId)) {
      showLog("Invalid task ID");
      return; // Si isEditing no es un número válido, no continuar
    }
    if(duplicatesCheck) {
      const matchingTasks = db.getAllSync("select * from tasks where text like ?", [taskText]);
      if(matchingTasks.length > 0) {
        showLog("Task already exist");
        return;
      }
    }

    if (isEditing) {
      // Verificar si la tarea realmente existe antes de hacer la actualización
      /* const checkTaskResult = db.getFirstSync('select id from tasks where id = ?', [taskId]);
        if (checkTaskResult.id > 0) {
            showLog(`${checkTaskResult.id}`);
            //return; // Si no existe la tarea, no continuar con la actualización
        } */
      // Actualizar la tarea en la base de datos
      const result = db.runSync("update tasks set text = ? where id = ?", [
        taskText,
        taskId.toString(),
      ]);

      if (result.changes > 0) {
        // Actualizar el estado de las tareas en la UI
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, text: taskText } : task
          )
        );
        //showLog(`Task edited: ${taskText}`);
        setIdEditing(null); // Limpiar el campo de edición
      } else {
        showLog("Error editing task");
      }

      Keyboard.dismiss();
    } else {
      // Calcular el próximo sortOrder (mayor que todos los existentes)
      const maxOrder = tasks.length > 0 
        ? Math.max(...tasks.map(t => t.sortOrder || 0)) 
        : 0;
      
      const nextOrder = maxOrder + 1;
      /*       const newTask = {id: Date.now().toString(), text: taskText};
      console.log(newTask);
      setTasks([...tasks, newTask]); */
      const result = db.runSync(
        "insert into tasks (text, isCrossed, sortOrder) values (?, ?, ?);", 
        [taskText, false, nextOrder]
      );
      // Crear objeto de tarea completo
      const newTask = { 
        id: result.lastInsertRowId, 
        text: taskText,
        isCrossed: false,
        sortOrder: nextOrder
      };
      setTasks([...tasks, newTask]);
      //showLog(`Task added: ${taskText}`);
      Keyboard.dismiss();
    }
    setTaskText("");
  }
 // Nueva función para manejar el reordenamiento
  const handleDragEnd = ({ data }) => {
    // Actualizar el estado local
    setTasks(data);
    
    // Actualizar la base de datos con el nuevo orden
    data.forEach((task, index) => {
      db.runSync("UPDATE tasks SET sortOrder = ? WHERE id = ?", [index, task.id]);
    });
  };
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
          <ThemedText style={styles.titlegeneral}>買い物リスト</ThemedText>
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
              <Text style={styles.addText}>{isEditing ? "編集" : "入力"}</Text>
              <Icon name="done" color="red"></Icon>
            </TouchableOpacity>   
            <TouchableOpacity style={styles.duplicatesButton}>
              <CheckBox checked={duplicatesCheck} containerStyle={styles.duplicatesButton} title={<Text style={styles.buttonsText}>重複チェック  </Text>} onPress={() => setDuplicatesCheck(!duplicatesCheck)}
                iconRight= "true" checkedColor="green" textStyle={styles.buttonsText}
                />
            </TouchableOpacity>     
          </View>
          <View style={styles.crossButtonRow}>
            <TouchableOpacity
              style={[styles.crossButton, { backgroundColor: "#27ae60" }]}
              onPress={() => handleCrossUncrossAll(true)}
            >
              <Text style={styles.buttonsText}>✓ 全部済み</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.crossButton, { backgroundColor: "#e67e22" }]}
              onPress={() => handleCrossUncrossAll(false)}
            >
              <Text style={styles.buttonsText}>○ リセット</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.crossButton, { backgroundColor: "#3498db" }]}
              onPress={handleChangeOrder}
            >
              <Text style={styles.buttonsText}>↕ 並び替え</Text>
            </TouchableOpacity>
          </View>
          <DraggableFlatList
            data={tasks}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTask}
            containerStyle={styles.listContainer}
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
    justifyContent: "center",
  },
  addButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },
  crossButtonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 5,
  },

  crossButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },

  addText: {
    color: "white",
    marginLeft: 10,
  },
  buttonsText: {
    color: "white",
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
    marginBottom: 1,
    borderColor: "blue",
    borderWidth: 1,
    padding: 10,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "green",
    paddingVertical: 10,
    marginRight: 0,        // espacio con el otro botón
    borderRadius: 20,
  },
  duplicatesButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 10,
    marginLeft: 0,
    borderRadius: 20,
    borderColor: 'transparent'
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
    justifyContent: "center",
  },
    listContainer: {
    flex: 1,
    marginTop: 10,
  },
});
