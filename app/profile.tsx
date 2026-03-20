import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import { logoutUser } from '../services/authService';

export default function Profile() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.userDetail}>Name: Chewii</Text>
      <Text style={styles.userDetail}>Email: chewii@example.com</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: Colors.error }]} onPress={handleLogout}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F2F8F8' },
  title: { fontSize: 20, fontWeight: '700', color: '#173C3C', marginBottom: 12 },
  userDetail: { fontSize: 16, marginBottom: 6 },
  button: { backgroundColor: Colors.primary, padding: 12, borderRadius: 12, alignItems: 'center', marginVertical: 6 },
});