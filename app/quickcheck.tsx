import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 40;

export default function QuickCheck() {
  // Data will come dynamically from backend/SMS
  const data: any[] = [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Check</Text>
      {data.length > 0 ? (
        <PieChart
          data={data}
          width={screenWidth}
          height={220}
          chartConfig={{ color: (opacity = 1) => `rgba(0,0,0,${opacity})` }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      ) : (
        <Text>No transactions yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F8F8', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#173C3C' },
});