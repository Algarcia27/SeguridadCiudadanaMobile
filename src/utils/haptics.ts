import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS !== 'web';

export const impactLight = () => {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const impactMedium = () => {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

export const impactHeavy = () => {
  if (isNative) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};

export const notifySuccess = () => {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

export const notifyWarning = () => {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

export const notifyError = () => {
  if (isNative) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
