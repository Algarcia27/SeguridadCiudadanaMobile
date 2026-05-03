import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { impactLight } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  time: string;
  read?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: 'Central de Emergencias recibida. ¿Cuál es su situación actual y su ubicación exacta?', isUser: false, time: '14:20' },
  { id: '2', text: 'He presenciado un accidente en la esquina de Av. Central y Calle 4. Hay dos personas heridas.', isUser: true, time: '14:21', read: true },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const listRef = useRef<FlatList>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const sendMessage = () => {
    if (!message.trim()) return;
    impactLight();
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newMsg: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      isUser: true,
      time,
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Unidades despachadas hacia su ubicación. ETA: 5 minutos. Permanezca en el lugar.',
        isUser: false,
        time: `${now.getHours()}:${String(now.getMinutes() + 1).padStart(2, '0')}`,
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, item.isUser ? styles.msgRowUser : styles.msgRowOp]}>
      {!item.isUser && (
        <View style={[styles.opAvatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="headset" size={16} color={colors.primary} />
        </View>
      )}
      <View style={styles.msgContent}>
        <View style={[
          styles.bubble,
          item.isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleOp, { backgroundColor: colors.surfaceContainer }],
        ]}>
          <Text style={[styles.bubbleText, { color: item.isUser ? '#fff' : colors.foreground }]}>
            {item.text}
          </Text>
        </View>
        <View style={[styles.msgMeta, item.isUser && { alignSelf: 'flex-end', flexDirection: 'row', gap: 4 }]}>
          <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{item.time}</Text>
          {item.isUser && (
            <Ionicons name="checkmark-done" size={14} color={item.read ? colors.primary : colors.mutedForeground} />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={[styles.opInfo]}>
          <View style={{ position: 'relative' }}>
            <View style={[styles.opAvatarLg, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="headset" size={22} color={colors.primary} />
            </View>
            <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.surface }]} />
          </View>
          <View>
            <Text style={[styles.opName, { color: colors.foreground }]}>Operador de Guardia</Text>
            <Text style={[styles.opStatus, { color: colors.success }]}>Conectado • ID #492</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.endBtn, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
          <Text style={[styles.endBtnText, { color: colors.danger }]}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.timeTag}>
            <View style={[styles.timeTagBg, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[styles.timeTagText, { color: colors.mutedForeground }]}>Hoy, 14:20</Text>
            </View>
          </View>
        }
      />

      <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputActions}>
          {(['camera-outline', 'location-outline', 'mic-outline', 'image-outline'] as const).map((icon) => (
            <TouchableOpacity key={icon}>
              <Ionicons name={icon} size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputWrap, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Mensaje..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: message.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  opInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 4 },
  opAvatarLg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  opName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  opStatus: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  endBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  endBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },
  timeTag: { alignItems: 'center', marginBottom: 8 },
  timeTagBg: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16 },
  timeTagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  msgRow: { flexDirection: 'row', gap: 8, maxWidth: '85%' },
  msgRowUser: { alignSelf: 'flex-end' },
  msgRowOp: { alignSelf: 'flex-start' },
  opAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  msgContent: { gap: 4 },
  bubble: { padding: 12, borderRadius: 18 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleOp: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  msgTime: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  inputArea: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  inputActions: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputWrap: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  input: { fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
