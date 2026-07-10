import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'emergency_contacts';

export const saveContacts = async (contacts: { name: string; phone: string }[]) => {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(contacts));
};

export const getContacts = async () => {
  const data = await SecureStore.getItemAsync(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};