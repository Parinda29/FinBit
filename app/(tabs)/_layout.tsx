import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            paddingTop: 8,
            backgroundColor: Colors.background,
          },
          tabBarShowLabel: true,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 1,
            marginBottom: 4,
          },
          tabBarStyle: [styles.tabBar, { backgroundColor: Colors.white, borderColor: Colors.border }],
          tabBarItemStyle: styles.tabItem,
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconSlot}>
              <MaterialIcons name="home" size={size} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconSlot}>
              <MaterialIcons name="receipt-long" size={size} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: () => (
            <View style={[styles.addIconWrap, { borderColor: Colors.white }]}> 
              <MaterialIcons name="add" size={24} color={Colors.white} />
            </View>
          ),
          tabBarButton: () => (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.addButtonTouchable}
              onPress={() => router.push('/quick-add')}
            >
              <View style={[styles.addIconWrap, { borderColor: Colors.white }]}> 
                <MaterialIcons name="add" size={24} color={Colors.white} />
              </View>
              <Text style={styles.addLabel}>Add</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconSlot}>
              <MaterialIcons name="insights" size={size} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconSlot}>
              <MaterialIcons name="person-outline" size={size} color={color} />
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 4,
    height: 76,
    borderRadius: 24,
    paddingTop: 8,
    paddingBottom: 6,
    borderWidth: 1,
    elevation: 9,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tabItem: {
    paddingTop: 1,
  },
  iconSlot: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  addButtonTouchable: {
    top: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24,
    shadowRadius: 11,
    elevation: 8,
  },
  addLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
});
