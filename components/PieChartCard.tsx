import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Colors from '../constants/colors';

export interface PieChartData {
  name: string;
  amount: number;
  color: string;
}

interface PieChartCardProps {
  data: PieChartData[];
  title: string;
}

const PieChartCard: React.FC<PieChartCardProps> = ({ data, title }) => {
  const screenWidth = Dimensions.get('window').width - 48; // padding

  const chartData = data.map(item => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: Colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <PieChart
        data={chartData}
        width={screenWidth}
        height={180}
        chartConfig={{
          color: (opacity = 1) => `rgba(13, 110, 110, ${opacity})`,
          labelColor: () => Colors.textPrimary,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
});

export default PieChartCard;