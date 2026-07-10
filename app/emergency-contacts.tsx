import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/src/hooks/useColors';
import { saveContacts, getContacts } from '../src/utils/contacts';

interface Contacto {
  name: string;
  phone: string;
}

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState<Contacto[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    const data = await getContacts();
    setContacts(data);
  };

  const saveContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    let updatedContacts;
    if (editingIndex !== null) {
      updatedContacts = [...contacts];
      updatedContacts[editingIndex] = { name, phone };
      setEditingIndex(null);
    } else {
      updatedContacts = [...contacts, { name, phone }];
    }

    await saveContacts(updatedContacts);
    setContacts(updatedContacts);
    setName(''); setPhone('');
  };

  const deleteContact = async (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    await saveContacts(updated);
    setContacts(updated);
  };

  const startEdit = (index: number) => {
    setName(contacts[index].name);
    setPhone(contacts[index].phone);
    setEditingIndex(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Contactos de Emergencia</Text>
      </View>

      <View style={styles.content}>
        <TextInput 
          style={[styles.input, { backgroundColor: colors.surfaceContainer, color: colors.foreground, borderColor: colors.border }]} 
          placeholder="Nombre del familiar" 
          placeholderTextColor={colors.mutedForeground}
          value={name} 
          onChangeText={setName} 
        />
        <TextInput 
          style={[styles.input, { backgroundColor: colors.surfaceContainer, color: colors.foreground, borderColor: colors.border }]} 
          placeholder="Número de teléfono" 
          placeholderTextColor={colors.mutedForeground}
          value={phone} 
          onChangeText={setPhone} 
          keyboardType="phone-pad" 
        />
        
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={saveContact}>
          <Text style={styles.saveBtnText}>{editingIndex !== null ? 'Actualizar' : 'Guardar'}</Text>
        </TouchableOpacity>

        <FlatList 
          data={contacts}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={[styles.contactCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={{ color: colors.primary }}>{item.phone}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 15 }}>
                <TouchableOpacity onPress={() => startEdit(index)}>
                  <Ionicons name="pencil-outline" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteContact(index)}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 15 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  content: { padding: 20, gap: 12 },
  input: { padding: 16, borderRadius: 14, borderWidth: 1, fontSize: 14 },
  saveBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  contactCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactName: { fontWeight: 'bold', fontSize: 16 }
});