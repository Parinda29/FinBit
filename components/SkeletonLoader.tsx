import React, { useEffect } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { createShimmerAnimation } from '../utils/animations';

interface SkeletonLoaderProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  count?: number;
  gap?: number;
}

/**
 * Skeleton loader with shimmer effect
 * Modern fintech loading indicator
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = 300,
  height = 16,
  borderRadius = 8,
  style,
  count = 3,
  gap = 12,
}) => {
  const { startAnimation, getOpacity } = createShimmerAnimation();

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            {
              width,
              height,
              borderRadius,
              backgroundColor: '#E5E7EB',
              marginBottom: index < count - 1 ? gap : 0,
              opacity: getOpacity(),
            },
            style,
          ]}
        />
      ))}
    </View>
  );
};

export default SkeletonLoader;
