import { useEffect } from 'react';
import { createStaggeredListAnimation } from '../utils/animations';

/**
 * Hook for staggered list item animations
 * Use this to animate list items as they appear
 */
export const useListAnimation = (itemCount: number) => {
  const { animations, animate, createItemStyle } = createStaggeredListAnimation(itemCount);

  useEffect(() => {
    animate();
  }, [itemCount]);

  return {
    getItemAnimatedStyle: (index: number) => createItemStyle(index),
  };
};
