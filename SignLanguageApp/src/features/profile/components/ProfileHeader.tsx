import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Avatar, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit2, MapPin, Globe } from 'lucide-react-native';

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

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.tertiary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.avatarContainer}>
        {isEditing ? (
          <TouchableOpacity onPress={handlePickImage}>
            {editedProfile.avatar ? (
              <Avatar.Image size={90} source={{ uri: editedProfile.avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Icon size={90} icon="camera" style={styles.avatar} />
            )}
          </TouchableOpacity>
        ) : (
          profile.avatar ? (
            <Avatar.Image size={90} source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <Avatar.Icon size={90} icon="account" style={styles.avatar} />
          )
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
            <Text variant="headlineSmall" style={styles.userName}>{profile.name}</Text>
            <IconButton icon={() => <Edit2 size={18} color="white" />} onPress={() => setIsEditing(true)} />
          </View>
          <Text variant="bodyMedium" style={styles.userEmail}>{profile.email}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MapPin size={14} color="rgba(255,255,255,0.8)" />
              <Text variant="bodySmall" style={styles.detailText}>{profile.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Globe size={14} color="rgba(255,255,255,0.8)" />
              <Text variant="bodySmall" style={styles.detailText}>{profile.nativeLanguage}</Text>
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
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#E1E1E1',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    margin: 0,
    width: 32,
    height: 32,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    opacity: 0.8,
    color: 'white',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    opacity: 0.7,
  },
  detailText: {
    marginLeft: 4,
    color: 'rgba(255,255,255,0.9)',
  },
});
