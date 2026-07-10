import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} 
from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';

const TAB_CONFIG: Record<string, { icon: string; iconFocused: string }> = {
  index:    { icon: 'home-outline',                iconFocused: 'home' },
  map:      { icon: 'map-outline',                 iconFocused: 'map' },
  news:     { icon: 'newspaper-outline',           iconFocused: 'newspaper' },
  info:     { icon: 'information-circle-outline',  iconFocused: 'information-circle' },
  profile:  { icon: 'person-outline',              iconFocused: 'person' },
  settings: { icon: 'settings-outline',            iconFocused: 'settings' },
};

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const bottomPad = Platform.OS === 'web' ? 12 : Math.max(insets.bottom, 12);

  const labelKey: Record<string, string> = {
    index:    'home',
    map:      'map',
    news:     'news',
    info:     'institutional',
    profile:  'profile',
    settings: 'settings',
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPad, backgroundColor: 'transparent' }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surfaceContainer,
            shadowColor: colors.foreground,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const cfg = TAB_CONFIG[route.name] ?? { icon: 'ellipse-outline', iconFocused: 'ellipse' };
          const label = t(labelKey[route.name] ?? route.name);

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconPill,
                  focused && { backgroundColor: colors.primary + '22' },
                ]}
              >
                <Ionicons
                  name={(focused ? cfg.iconFocused : cfg.icon) as any}
                  size={22}
                  color={focused ? colors.primary : colors.mutedForeground}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: focused ? colors.primary : colors.mutedForeground },
                  focused && styles.labelFocused,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 0,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconPill: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  labelFocused: {
    fontFamily: 'Inter_700Bold',
  },
});
