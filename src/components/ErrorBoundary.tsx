import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { reloadAppAsync } from 'expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/src/hooks/useColors';

function ErrorFallback({ error }: { error: Error }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Algo salió mal</Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>{error.message}</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={() => reloadAppAsync()}
      >
        <Text style={styles.buttonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
