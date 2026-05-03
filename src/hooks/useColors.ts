import { useColorScheme } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { useTheme } from '@/src/context/ThemeContext';

export function useColors() {
  const { theme } = useTheme();
  return theme === 'dark' ? Colors.dark : Colors.light;
}
