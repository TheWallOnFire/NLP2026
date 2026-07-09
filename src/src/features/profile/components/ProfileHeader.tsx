import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit2, MapPin, Globe } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
  profile: any;
  editedProfile: any;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handlePickImage: () => void;
}

export default function ProfileHeader({
  profile,
  editedProfile,
  isEditing,
  setIsEditing,
  handlePickImage
}: ProfileHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.tertiary || '#001b3a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1.5 }}
      style={[styles.headerGradient, { paddingTop: insets.top + 24 }]}
    >
      <View style={styles.avatarContainer}>
        {isEditing ? (
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
              {editedProfile.avatar ? (
                <Avatar.Image size={100} source={{ uri: editedProfile.avatar }} style={styles.avatar} />
              ) : (
                <Avatar.Icon size={100} icon="camera" style={styles.avatar} />
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.avatarWrapper}>
            {profile.avatar ? (
              <Avatar.Image size={100} source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Icon size={100} icon="account" style={styles.avatar} />
            )}
          </View>
        )}
        {!isEditing && (
          <IconButton
            icon={() => <Edit2 size={16} color="white" />}
            style={[styles.editAvatarBtn, { backgroundColor: theme.colors.secondary }]}
            onPress={() => setIsEditing(true)}
          />
        )}
      </View>

      {!isEditing ? (
        <>
          <View style={styles.nameRow}>
            <Text variant="headlineMedium" style={styles.userName}>{profile.name}</Text>
            <IconButton icon={() => <Edit2 size={18} color="white" opacity={0.7} />} onPress={() => setIsEditing(true)} />
          </View>
          <Text variant="titleMedium" style={styles.userEmail}>{profile.email}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MapPin size={14} color="rgba(255,255,255,0.8)" />
              <Text variant="bodyMedium" style={styles.detailText}>{profile.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Globe size={14} color="rgba(255,255,255,0.8)" />
              <Text variant="bodyMedium" style={styles.detailText}>{profile.nativeLanguage}</Text>
            </View>
          </View>
        </>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    marginBottom: 20,
    paddingBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarWrapper: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  avatar: {
    backgroundColor: '#E1E1E1',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    margin: 0,
    width: 36,
    height: 36,
    borderWidth: 3,
    borderColor: 'white',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  userName: {
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  userEmail: {
    opacity: 0.85,
    color: 'white',
    marginBottom: 16,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  detailText: {
    marginLeft: 6,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
});
