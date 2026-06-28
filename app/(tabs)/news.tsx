import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Linking,
} 
from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';



interface Post {
  id: string;
  title: string;
  url: string;
  content_text?: string;
  summary?: string;
  date_published?: string;
  image?: string; 
}

const RSS_JSON_URL = 'https://rss.app/feeds/v1.1/_YNW7L8sCJeqjfohJ.json';

function PostCard({ post, colors, t }: { post: Post; colors: any; t: (k: string) => string }) {
  // Limpiamos etiquetas HTML o textos extraños que puedan venir en el feed
  const limpiarTexto = (texto?: string) => {
    if (!texto) return '';
    return texto.replace(/<[^>]*>/g, '').trim();
  };

  // Si RSS.app no provee imagen o falla, usamos una institucional por defecto basada en Picsum
  const imagenUri = post.image || `https://picsum.photos/seed/${post.id}/800/600`;
  
  // Formateamos la fecha de publicación de manera limpia
  const fechaFormateada = post.date_published 
    ? new Date(post.date_published).toLocaleDateString() 
    : t('officialInfo');

  return (
    <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Encabezado Institucional Fijo */}
      <View style={styles.postHeader}>
        <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: 'transparent' }]}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: '100%', height: '100%', borderRadius: 17 }} 
              resizeMode="contain" 
            />
          </View>
        </View>
        <View style={styles.postMeta}>
          <Text style={[styles.postUser, { color: colors.foreground }]}>@seguridadciudadanatachira</Text>
          <Text style={[styles.postLocation, { color: colors.mutedForeground }]}>Táchira, Venezuela</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedForeground} />
      </View>

      {/* Contenedor de Imagen */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imagenUri }} style={styles.postImage} resizeMode="cover" />
      </View>

      {/* Acciones e Interacciones Limpias */}
      <View style={styles.postActions}>
        <View style={styles.actionsLeft}>
          <Ionicons name="heart-outline" size={26} color={colors.foreground} />
          <Ionicons name="chatbubble-outline" size={24} color={colors.foreground} />
          <TouchableOpacity onPress={() => Linking.openURL(post.url)}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <Ionicons name="bookmark-outline" size={24} color={colors.foreground} />
      </View>

      {/* Contenido Dinámico */}
      <View style={styles.postContent}>
        <Text style={[styles.postLikes, { color: colors.foreground }]}>
          {post.title}
        </Text>
        <Text style={[styles.postCaption, { color: colors.foreground }]}>
          {limpiarTexto(post.content_text || post.summary)}
        </Text>
        <Text style={[styles.postTags, { color: colors.primary }]}>#SeguridadCiudadana #AlertaPreventiva</Text>
        <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{fechaFormateada}</Text>
      </View>

      {/* Botón de Acción para expandir la Noticia */}
      <TouchableOpacity
        style={[styles.instagramBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
        onPress={() => Linking.openURL(post.url)}
      >
        <Ionicons name="globe-outline" size={16} color={colors.foreground} />
        <Text style={[styles.instagramBtnText, { color: colors.foreground }]}>Ver Boletín Completo</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  
  const fetchNews = async () => {
    try {
      const response = await fetch(RSS_JSON_URL);
      const data = await response.json();
      
      
      setPosts(data.items || []);
    } catch (error) {
      console.error("Error cargando el feed de noticias: ", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  useEffect(() => {
    fetchNews();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  if (loading) {
    return (
      <View style={[styles.centerLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.mutedForeground }}>Cargando información oficial...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} colors={colors} t={t} />}
        contentContainerStyle={[styles.list, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={5}
        windowSize={3}
        ListHeaderComponent={
          <View style={styles.feedHeader}>
            <View>
              <Text style={[styles.feedTitle, { color: colors.foreground }]}>{t('newsFeed')}</Text>
              <Text style={[styles.feedSub, { color: colors.mutedForeground }]}>{t('officialInfo')}</Text>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={[styles.refreshBtn, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons name="refresh-outline" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: colors.mutedForeground }}>No hay alertas recientes en este momento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  feedTitle: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  feedSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  postCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  avatarRing: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 2 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  postMeta: { flex: 1 },
  postUser: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  postLocation: { fontSize: 11, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5 },
  imageContainer: { width: '100%', aspectRatio: 4 / 3, position: 'relative' },
  postImage: { width: '100%', height: '100%' },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  actionsLeft: { flexDirection: 'row', gap: 16 },
  postContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  postLikes: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 18, marginBottom: 2 },
  postCaption: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  postTags: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  postTime: { fontSize: 11, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  instagramBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: 14, marginTop: 4, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  instagramBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});