import React, { useEffect } from 'react';
import { Animated, View, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createSplashAnimation } from '../utils/animations';
import Colors from '../constants/colors';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number;
}

/**
 * Premium splash screen with fade-in + scale animation
 * Smooth transition to main app
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete, duration = 800 }) => {
  const { fadeAnim, scaleAnim, animate } = createSplashAnimation(duration);

  useEffect(() => {
    animate();
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, duration + 500); // Give animation time to complete

    return () => clearTimeout(timer);
  }, [animate, duration, onAnimationComplete]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.background}>
        {/* Subtle gradient accent */}
        <View style={styles.gradientAccent} />

        {/* Animated logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoBox}>
            <MaterialIcons name="account-balance-wallet" size={48} color={Colors.white} />
          </View>
          <Animated.Text
            style={[
              styles.brandName,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            FinBit
          </Animated.Text>
          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            Smart Financial Control
          </Animated.Text>
        </Animated.View>

        {/* Bottom accent dots */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: fadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: fadeAnim,
                marginLeft: 8,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: fadeAnim,
                marginLeft: 8,
              },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  gradientAccent: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7C3AED',
    opacity: 0.08,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  brandName: {
    marginTop: 20,
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.8,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});

export default SplashScreen;
