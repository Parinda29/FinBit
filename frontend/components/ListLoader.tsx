import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface ListLoaderProps {
  count?: number;
  itemHeight?: number;
}

/**
 * List loader with multiple skeleton items
 * Premium loading placeholder for lists
 */
const ListLoader: React.FC<ListLoaderProps> = ({ count = 5, itemHeight = 60 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.item, { height: itemHeight }]}>
          <View style={styles.row}>
            <SkeletonLoader width={40} height={40} borderRadius={8} count={1} />
            <View style={styles.textColumn}>
              <SkeletonLoader width={200} height={12} borderRadius={6} count={1} />
              <SkeletonLoader width={150} height={10} borderRadius={6} count={1} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
});

export default ListLoader;
