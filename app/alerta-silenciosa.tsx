import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as SMS from 'expo-sms';
import * as Location from 'expo-location';
import { impactHeavy } from '@/src/utils/haptics';

export default function AlertaSilenciosa() {
  const [count, setCount] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  
  useEffect(() => {
    if (count > 0 && count < 3) {
      const timer = setTimeout(() => setCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const triggerEmergency = async () => {
    impactHeavy();
    
    
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Error", "Necesitamos acceso a tu ubicación para enviar la alerta.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    const locationUrl = `https://www.google.com/maps?q=${loc.coords.latitude},${loc.coords.longitude}`;
    
    
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      const { result } = await SMS.sendSMSAsync(
        ['0414-XXXXXXX'], 
        `🚨 ¡ALERTA DE EMERGENCIA! Estoy en peligro. Mi ubicación: ${locationUrl}`
      );
      Alert.alert("Alerta Enviada", "Se ha enviado un mensaje a tus contactos.");
    } else {
      Alert.alert("Error", "No se pudo enviar el SMS desde este dispositivo.");
    }
  };

  const handlePress = () => {
    const newCount = count + 1;
    if (newCount === 3) {
      triggerEmergency();
      setCount(0);
    } else {
      setCount(newCount);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerta Silenciosa</Text>
      <Text style={styles.text}>Presiona 3 veces el botón para enviar SOS:</Text>
      
      <TouchableOpacity style={styles.panicButton} onPress={handlePress}>
        <Text style={styles.btnText}>{3 - count}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  text: { fontSize: 16, color: '#ccc', marginBottom: 40 },
  panicButton: { 
    width: 200, height: 200, borderRadius: 100, 
    backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center' 
  },
  btnText: { color: '#fff', fontSize: 60, fontWeight: 'bold' }
});