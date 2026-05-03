import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';

interface Post {
  id: string;
  user: string;
  location: string;
  image: string;
  likes: number;
  caption: string;
  tags: string;
  time: string;
  isLive?: boolean;
  alert?: string;
  url: string;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: '@seguridadciudadanatachira',
    location: 'Táchira, Venezuela',
    image: 'https://picsum.photos/seed/seguridad1/800/600',
    likes: 1240,
    caption: 'Despliegue de seguridad en el estado Táchira para garantizar la paz de nuestros ciudadanos. Juntos construimos un estado más seguro.',
    tags: '#Seguridad #Tachira #Paz #Venezuela',
    time: 'Hace 2 horas',
    isLive: false,
    url: 'https://www.instagram.com/seguridadciudadanatachira/',
  },
  {
    id: '2',
    user: '@seguridadciudadanatachira',
    location: 'San Cristóbal',
    image: 'https://picsum.photos/seed/seguridad2/800/600',
    likes: 980,
    caption: 'Atención inmediata ante emergencias viales. Nuestro equipo siempre está alerta para servir a la comunidad tachirense.',
    tags: '#Emergencia #Vialidad #Tachira',
    time: 'Hace 5 horas',
    alert: '⚠️ Cierre vial en Av. Central por mantenimiento.',
    url: 'https://www.instagram.com/seguridadciudadanatachira/',
  },
  {
    id: '3',
    user: '@seguridadciudadanatachira',
    location: 'Estado Táchira',
    image: 'https://picsum.photos/seed/seguridad3/800/600',
    likes: 2150,
    caption: 'Nueva jornada de capacitación para nuestro cuerpo de seguridad. Profesionales comprometidos con el bienestar de Táchira.',
    tags: '#Capacitacion #Seguridad #Profesionales',
    time: 'Hace 1 día',
    isLive: false,
    url: 'https://www.instagram.com/seguridadciudadanatachira/',
  },
];

function PostCard({ post, colors, t }: { post: Post; colors: any; t: (k: string) => string }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.avatarRing, { borderColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield" size={18} color={colors.primary} />
          </View>
        </View>
        <View style={styles.postMeta}>
          <Text style={[styles.postUser, { color: colors.foreground }]}>{post.user}</Text>
          <Text style={[styles.postLocation, { color: colors.mutedForeground }]}>{post.location}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.mutedForeground} />
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
        {post.isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{t('liveLabel')}</Text>
          </View>
        )}
        {post.alert && (
          <View style={[styles.alertBanner, { backgroundColor: colors.primary + 'E0' }]}>
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text style={styles.alertBannerText}>{post.alert}</Text>
          </View>
        )}
      </View>

      <View style={styles.postActions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={() => setLiked(!liked)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? '#EF4444' : colors.foreground} />
          </TouchableOpacity>
          <Ionicons name="chatbubble-outline" size={24} color={colors.foreground} />
          <TouchableOpacity onPress={() => Linking.openURL(post.url)}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSaved(!saved)}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={saved ? colors.primary : colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={[styles.postLikes, { color: colors.foreground }]}>
          {(post.likes + (liked ? 1 : 0)).toLocaleString()} {t('likes')}
        </Text>
        <Text style={[styles.postCaption, { color: colors.foreground }]}>
          <Text style={{ fontFamily: 'Inter_700Bold' }}>{post.user} </Text>
          {post.caption}
        </Text>
        <Text style={[styles.postTags, { color: colors.primary }]}>{post.tags}</Text>
        <Text style={[styles.postTime, { color: colors.mutedForeground }]}>{post.time}</Text>
      </View>

      <TouchableOpacity
        style={[styles.instagramBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
        onPress={() => Linking.openURL(post.url)}
      >
        <Ionicons name="logo-instagram" size={16} color={colors.foreground} />
        <Text style={[styles.instagramBtnText, { color: colors.foreground }]}>{t('seeOnInstagram')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} colors={colors} t={t} />}
        contentContainerStyle={[styles.list, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={posts.length > 0}
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
  liveBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#F97316' },
  liveText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  alertBanner: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 12,
  },
  alertBannerText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold', flex: 1 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  actionsLeft: { flexDirection: 'row', gap: 16 },
  postContent: { paddingHorizontal: 14, paddingBottom: 14, gap: 4 },
  postLikes: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  postCaption: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  postTags: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  postTime: { fontSize: 11, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.3 },
  instagramBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: 14, marginTop: 4, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1,
  },
  instagramBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
