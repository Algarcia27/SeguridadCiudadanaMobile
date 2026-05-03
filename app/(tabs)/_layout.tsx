import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import FloatingTabBar from '@/src/components/FloatingTabBar';
import { useColors } from '@/src/hooks/useColors';

export const FLOATING_TAB_BAR_HEIGHT = Platform.OS === 'web' ? 90 : 82;

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingBottom: FLOATING_TAB_BAR_HEIGHT,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
        },
      }}
    />
  );
}
