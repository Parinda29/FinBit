import React, { useEffect } from 'react';
import { Animated, View, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createToastAnimation } from '../utils/animations';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

/**
 * Toast notification with slide-in animation
 * Premium fintech feedback system
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}) => {
  const { slideAnim, fadeAnim, slideIn, slideOut } = createToastAnimation(300);

  useEffect(() => {
    slideIn();
    const timer = setTimeout(() => {
      slideOut(() => {
        onDismiss?.();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss, slideIn, slideOut]);

  const typeConfig = {
    success: {
      backgroundColor: '#ECFDF5',
      textColor: '#059669',
      icon: 'check-circle',
      iconColor: '#10B981',
    },
    error: {
      backgroundColor: '#FEF2F2',
      textColor: '#DC2626',
      icon: 'error',
      iconColor: '#EF4444',
    },
    info: {
      backgroundColor: '#EFF6FF',
      textColor: '#1E40AF',
      icon: 'info',
      iconColor: '#3B82F6',
    },
  };

  const config = typeConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View
        style={[
          styles.toastBox,
          {
            backgroundColor: config.backgroundColor,
          },
        ]}
      >
        <MaterialIcons name={config.icon as any} size={20} color={config.iconColor} />
        <Text
          style={[
            styles.message,
            {
              color: config.textColor,
            },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 9998,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});

export default Toast;
