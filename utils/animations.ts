import { Animated, Easing } from 'react-native';

/**
 * Animation Utilities for FinBit App
 * Provides reusable animation configurations for smooth, premium feel
 */

// Screen entrance animation (fade + translateY)
export const createScreenEntranceAnimation = (duration: number = 300) => {
  const fadeAnim = new Animated.Value(0);
  const translateY = new Animated.Value(20);

  const animate = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    fadeAnim,
    translateY,
    animate,
    animatedStyle: {
      opacity: fadeAnim,
      transform: [{ translateY }],
    },
  };
};

// Splash screen animation (fade-in + scale)
export const createSplashAnimation = (duration: number = 800) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

  const animate = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    fadeAnim,
    scaleAnim,
    animate,
    animatedStyle: {
      opacity: fadeAnim,
      transform: [{ scale: scaleAnim }],
    },
  };
};

// Button press animation (scale with bounce)
export const createPressAnimation = () => {
  const scaleAnim = new Animated.Value(1);

  const onPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return {
    scaleAnim,
    onPressIn,
    onPressOut,
    animatedStyle: {
      transform: [{ scale: scaleAnim }],
    },
  };
};

// Staggered list animation
export const createStaggeredListAnimation = (itemCount: number) => {
  const animations = Array.from({ length: itemCount }).map(() => new Animated.Value(0));

  const animate = () => {
    Animated.stagger(
      50, // delay between each animation
      animations.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  };

  return {
    animations,
    animate,
    createItemStyle: (index: number) => ({
      opacity: animations[index],
      transform: [
        {
          translateY: animations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    }),
  };
};

// Shimmer skeleton animation
export const createShimmerAnimation = () => {
  const shimmerAnim = new Animated.Value(0);

  const startAnimation = () => {
    shimmerAnim.setValue(0);
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  };

  return {
    shimmerAnim,
    startAnimation,
    getOpacity: () =>
      shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1, 0.5],
      }),
  };
};

// Card elevation animation
export const createCardElevationAnimation = () => {
  const elevation = new Animated.Value(0);

  const onPressIn = () => {
    Animated.timing(elevation, {
      toValue: 8,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(elevation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  return {
    elevation,
    onPressIn,
    onPressOut,
    shadowStyle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: elevation.interpolate({
        inputRange: [0, 8],
        outputRange: [0.05, 0.15],
      }),
      shadowRadius: elevation.interpolate({
        inputRange: [0, 8],
        outputRange: [2, 8],
      }),
    },
  };
};

// Fade-in animation
export const createFadeAnimation = (duration: number = 300) => {
  const fadeAnim = new Animated.Value(0);

  const animate = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return {
    fadeAnim,
    animate,
    animatedStyle: { opacity: fadeAnim },
  };
};

// Pulse animation (for loading indicators)
export const createPulseAnimation = () => {
  const pulseAnim = new Animated.Value(1);

  const startAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return {
    pulseAnim,
    startAnimation,
    animatedStyle: { opacity: pulseAnim },
  };
};

// Toast slide-in animation
export const createToastAnimation = (duration: number = 300) => {
  const slideAnim = new Animated.Value(-100);
  const fadeAnim = new Animated.Value(0);

  const slideIn = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const slideOut = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start(cb);
  };

  return {
    slideAnim,
    fadeAnim,
    slideIn,
    slideOut,
    animatedStyle: {
      transform: [{ translateY: slideAnim }],
      opacity: fadeAnim,
    },
  };
};

// Chart drawing animation
export const createChartDrawAnimation = (duration: number = 800) => {
  const drawAnim = new Animated.Value(0);

  const animate = () => {
    Animated.timing(drawAnim, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  return {
    drawAnim,
    animate,
    progress: drawAnim,
  };
};
