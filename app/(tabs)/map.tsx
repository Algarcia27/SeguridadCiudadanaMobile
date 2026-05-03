import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '@/src/hooks/useColors';

const { width, height } = Dimensions.get('window');

function PulseMarker({ color }: { color: string }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.5, { duration: 1200, easing: Easing.out(Easing.ease) }), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value,
  }));
  return (
    <View>
      <Animated.View style={[styles.pulse, { backgroundColor: color }, pulseStyle]} />
      <View style={[styles.markerDot, { backgroundColor: color, borderColor: '#fff' }]}>
        <Ionicons name="alert" size={12} color="#fff" />
      </View>
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapBg, { backgroundColor: colors.surfaceContainer }]}>
        <View style={[styles.gridLine, styles.gridH1, { borderColor: colors.border }]} />
        <View style={[styles.gridLine, styles.gridH2, { borderColor: colors.border }]} />
        <View style={[styles.gridLine, styles.gridH3, { borderColor: colors.border }]} />
        <View style={[styles.gridLine, styles.gridV1, { borderColor: colors.border }]} />
        <View style={[styles.gridLine, styles.gridV2, { borderColor: colors.border }]} />
        <View style={[styles.gridLine, styles.gridV3, { borderColor: colors.border }]} />

        <View style={[styles.quadrant, { borderColor: colors.primary + '30' }]}>
          <View style={[styles.quadrantLabel, { backgroundColor: colors.surface }]}>
            <Text style={[styles.quadrantText, { color: colors.primary }]}>Quadrant P-01 Active</Text>
          </View>
        </View>

        <View style={styles.userLocation}>
          <Animated.View style={[styles.userPulse, { backgroundColor: colors.primary + '20' }]} />
          <View style={[styles.userDot, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <View style={[styles.userCenter, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={[styles.incident1]}>
          <PulseMarker color="#EF4444" />
        </View>
        <View style={[styles.incident2]}>
          <PulseMarker color="#F97316" />
        </View>
      </View>

      <View style={[styles.topBar, { top: topPad + 12 }]}>
        <View style={[styles.topCard, { backgroundColor: colors.surface + 'E8', borderColor: colors.border }]}>
          <View style={[styles.topCardIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.topCardLabel, { color: colors.mutedForeground }]}>Visibility: Clear</Text>
            <Text style={[styles.topCardValue, { color: colors.foreground }]}>Av. Francisco de Miranda</Text>
          </View>
        </View>
      </View>

      <View style={styles.floatingControls}>
        <TouchableOpacity style={[styles.floatBtn, { backgroundColor: colors.surface + 'E8', borderColor: colors.border }]}>
          <Ionicons name="layers-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatBtn, { backgroundColor: colors.surface + 'E8', borderColor: colors.border }]}>
          <Ionicons name="navigate-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomCard, { bottom: bottomPad + 20, backgroundColor: colors.surface + 'E8', borderColor: colors.border }]}>
        <View style={[styles.patrolIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
          <Ionicons name="shield-half-outline" size={24} color="#EF4444" />
        </View>
        <View style={styles.patrolInfo}>
          <Text style={[styles.patrolTitle, { color: colors.foreground }]}>Patrol P-01</Text>
          <Text style={[styles.patrolSub, { color: colors.mutedForeground }]}>Response time: &lt; 5 mins</Text>
        </View>
        <TouchableOpacity style={[styles.sosBtn, { backgroundColor: colors.foreground }]}>
          <Text style={[styles.sosBtnText, { color: colors.background }]}>SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapBg: { position: 'absolute', inset: 0 },
  gridLine: { position: 'absolute', borderWidth: 0.5 },
  gridH1: { top: '25%', left: 0, right: 0, borderBottomWidth: 0.5 },
  gridH2: { top: '50%', left: 0, right: 0, borderBottomWidth: 0.5 },
  gridH3: { top: '75%', left: 0, right: 0, borderBottomWidth: 0.5 },
  gridV1: { left: '25%', top: 0, bottom: 0, borderRightWidth: 0.5 },
  gridV2: { left: '50%', top: 0, bottom: 0, borderRightWidth: 0.5 },
  gridV3: { left: '75%', top: 0, bottom: 0, borderRightWidth: 0.5 },
  quadrant: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    right: '10%',
    bottom: '20%',
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
  },
  quadrantLabel: { marginTop: 16, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  quadrantText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, textTransform: 'uppercase' },
  userLocation: { position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -16 },
  userPulse: { position: 'absolute', inset: -20, borderRadius: 36 },
  userDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  userCenter: { width: 10, height: 10, borderRadius: 5 },
  incident1: { position: 'absolute', top: '30%', right: '22%' },
  incident2: { position: 'absolute', bottom: '38%', left: '18%' },
  pulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, top: -8, left: -8 },
  markerDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', left: 16, right: 16 },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
  },
  topCardIcon: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topCardLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  topCardValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  floatingControls: { position: 'absolute', right: 16, bottom: 200, gap: 10 },
  floatBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 28,
    borderWidth: 1,
  },
  patrolIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  patrolInfo: { flex: 1 },
  patrolTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  patrolSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  sosBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20 },
  sosBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
});
