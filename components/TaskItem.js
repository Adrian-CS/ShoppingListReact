import React from 'react'
import { Text, View, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { Icon } from '@rneui/themed';
import { useEffect, useRef, useState } from 'react';

const TaskItem = React.memo(({ item, handleEdit, handleDelete, handleDoneTask, drag, isActive }) => {
      const language = 1;
      const JapaneseText = new Map();
      JapaneseText.set('Edit', '編集');
      JapaneseText.set('Delete', '削除');
      let EditText = 'Edit';
      let DeleteText = 'Delete';
      if(language == 1) {
        EditText = JapaneseText.get('Edit');
        DeleteText = JapaneseText.get('Delete');
      }
      return (
<TouchableOpacity 
      style={[
        styles.task,
        isActive && styles.taskActive // Estilo cuando se está arrastrando
      ]}
      onLongPress={drag}  // Mantener pulsado el item completo para arrastrar
      delayLongPress={120}  // Opcional: ajustar tiempo de respuesta
      activeOpacity={0.8}
      onPress={() => handleDoneTask(item.id, item.isCrossed)}
    >
      <Text 
        style={[styles.taskText, item.isCrossed && styles.taskTextCrossed]}  
        
      >
        {item.text}
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Icon name="edit" color="#4caf50" size={24} style={styles.iconMargin} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Icon name="delete" color="red" size={24} style={styles.iconMargin} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'black',
    opacity: 0.7,
    borderRadius: 5,
  },
  taskText: {
    maxWidth: "80%",
    color: 'white',
    fontWeight: 'bold',
    padding: 5,
/*     borderColor: 'black',
    borderWidth: 2,
    borderRadius: 3, */
    textShadowColor: 'black',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  taskTextCrossed: {
    color: 'green',
    textDecorationLine: 'line-through',
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 15,
  },
  taskActive: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#f0f0f0', // Cambiar color de fondo al arrastrar
  },
  
  listContainer: {
    flex: 1,
  },
});
export default TaskItem;
