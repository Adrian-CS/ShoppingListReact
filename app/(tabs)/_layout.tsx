import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
/* import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native'; */

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function TabLayout() {
  const colorScheme = useColorScheme();
/*   const [initialRoute, setInitialRoute] = useState<string>('indexv1'); // Valor por defecto

  useEffect(() => {
    const loadLastTab = async () => {
      const lastTab = await AsyncStorage.getItem('lastTab');
      if (lastTab) {
        setInitialRoute(lastTab);
      }
    };

    loadLastTab();
  }, []);

  // Guardar la pestaña seleccionada cuando la pantalla recibe el enfoque
  useFocusEffect(
    React.useCallback(() => {
      const saveCurrentTab = async () => {
        const currentRoute =  useRoute().name; // Aquí puedes reemplazarlo por el nombre de la ruta actual
        await AsyncStorage.setItem('lastTab', currentRoute);
      };
      saveCurrentTab();
    }, [])
  ); */
  return (
    <Tabs
      //initialRouteName='indexv1'
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        })
      }}>
      <Tabs.Screen
        name="indexv1"
        options={{
          title: 'Simple list',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign
              name="shoppingcart"
              size={24}
              color={focused ? 'white' : 'grey'} // Cambiar el color a blanco si está enfocado
            />
          ),
          tabBarActiveTintColor: 'white', // Color del icono cuando está activo
          tabBarInactiveTintColor: 'grey', // Color del icono cuando no está activo
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ListManager"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign
              name="edit"
              size={24}
              color={focused ? 'white' : 'grey'} // Cambiar el color a blanco si está enfocado
            />
          ),
          tabBarActiveTintColor: 'white', // Color del icono cuando está activo
          tabBarInactiveTintColor: 'grey', // Color del icono cuando no está activo
        }}
      />
{/*       <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      /> */}
    </Tabs>
  );
}
