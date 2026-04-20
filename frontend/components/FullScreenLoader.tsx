import React, { useEffect } from 'react';
import { Animated, View, StyleSheet, ActivityIndicator } from 'react-native';
import { createPulseAnimation } from '../utils/animations';
import Colors from '../constants/colors';

interface FullScreenLoaderProps {
  visible?: boolean;
  message?: string;
}

/**
 * Full-screen loader overlay with pulsing indicator
 * Premium fintech feel
 */
const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ visible = true, message = 'Loading...' }) => {
  const { pulseAnim, startAnimation } = createPulseAnimation();

  useEffect(() => {
    if (visible) {
      startAnimation();
    }
  }, [visible, startAnimation]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loaderBox, { opacity: pulseAnim }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderBox: {
    alignItems: 'center',
  },
});

export default FullScreenLoader;
