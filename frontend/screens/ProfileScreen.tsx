import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import CustomButton from '../components/CustomButton';
import AuthInput from '../components/AuthInput';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchUserProfile, updateUserProfile, logoutUser } from '../services/authService';

const ProfileScreen: React.FC = () => {
  // navigation
  const router = useRouter();

  // User info state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  useEffect(() => {
    const loadProfile = async () => {
      const resp = await fetchUserProfile();
      if (resp && resp.user) {
        setName(resp.user.name || '');
        setEmail(resp.user.email || '');
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  // Save profile changes
  const handleSave = async () => {
    const payload: any = { name, email };
    if (password) payload.password = password;
    const resp = await updateUserProfile(payload);
    if (resp && resp.success) {
      Alert.alert('Success', 'Profile updated');
      setEditing(false);
      setPassword('');
    } else {
      Alert.alert('Error', resp.error || 'Could not update profile');
    }
  };

  // Logout
  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatar}>
            <MaterialIcons name="camera-alt" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <AuthInput
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            editable={editing}
            icon="person"
          />

          <AuthInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            editable={editing}
            icon="email"
          />

          {editing && (
            <AuthInput
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              icon="lock"
            />
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {editing ? (
              <>
                <CustomButton title="Save Changes" onPress={handleSave} />
                <CustomButton
                  title="Cancel"
                  onPress={() => setEditing(false)}
                  style={{ backgroundColor: Colors.lightGray, marginTop: 10 }}
                  textStyle={{ color: Colors.textPrimary }}
                />
              </>
            ) : (
              <>
                <CustomButton title="Edit Profile" onPress={() => setEditing(true)} />
                <CustomButton
                  title="Change Password"
                  onPress={() => setEditing(true)}
                  style={{ backgroundColor: Colors.info, marginTop: 10 }}
                />
              </>
            )}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            style={{ backgroundColor: Colors.error }}
          />
        </View>

        {/* Optional: Subscription / Premium */}
        <View style={styles.premiumContainer}>
          <Text style={styles.sectionTitle}>Subscription Plan</Text>
          <Text style={styles.premiumText}>Free Plan</Text>
          <CustomButton
            title="Upgrade to Premium"
            onPress={() => alert('Upgrade clicked!')}
            style={{ backgroundColor: Colors.primary }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: 6,
    borderRadius: 20,
  },

  infoContainer: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  buttonContainer: { marginTop: 12 },

  logoutContainer: { marginBottom: 30 },

  premiumContainer: { marginBottom: 20 },
  premiumText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
});

export default ProfileScreen;