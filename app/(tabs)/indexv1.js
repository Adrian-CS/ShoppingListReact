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
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState([]);

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
  useEffect(() => {
    //db.execSync('delete from tasks');
    db.execSync(
      "create table if not exists tasks (id integer primary key not null, text text);"
    );
    const result = db.getAllSync("select * from tasks");
    setTasks(result);
    setIsLoading(false);
    //showTasksInAlert();
  }, []);

  function handleDeleteTask(id) {
    //setTasks(tasks.filter((task) => task.id !== id));
    const result = db.runSync("delete from tasks where id = ?;", [id]);
    setTasks(tasks.filter((task) => task.id !== id));
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
      /*       const newTask = {id: Date.now().toString(), text: taskText};
      console.log(newTask);
      setTasks([...tasks, newTask]); */
      const result = db.runSync("insert into tasks (text) values (?);", [
        taskText,
      ]);
      const newTask = { id: result.lastInsertRowId.toString(), text: taskText };
      setTasks([...tasks, newTask]);
      //showLog(`Task added: ${taskText}`);
      Keyboard.dismiss();
    }
    setTaskText("");
  }

  const renderTask = ({ item }) => {
    return (
      <TaskItem
        item={item}
        handleEdit={handleEditTask}
        handleDelete={handleDeleteTask}
      />
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
              <Text style={styles.addText}>{isEditing ? "Edit" : "入力"}</Text>
              <Icon name="done" color="red"></Icon>
            </TouchableOpacity>
          </View>
          <FlatList
            data={tasks}
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
    justifyContent: "center",
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
    justifyContent: "center",
  },
});
