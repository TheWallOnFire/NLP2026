import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useProfileLogic } from '../hooks/useProfileLogic';
import ProfileHeader from '../components/ProfileHeader';
import ProfileEditForm from '../components/ProfileEditForm';
import ProfileStatsSection from '../components/ProfileStatsSection';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const {
    profile, editedProfile, setEditedProfile, isEditing, setIsEditing,
    learnedCount, favoriteCount, streakDays, handleSave, handleCancel, handlePickImage, errors
  } = useProfileLogic();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProfileHeader 
        profile={profile}
        editedProfile={editedProfile}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        handlePickImage={handlePickImage}
      />

      <View style={styles.section}>
        {isEditing ? (
          <ProfileEditForm 
            editedProfile={editedProfile}
            setEditedProfile={setEditedProfile}
            errors={errors}
            handleSave={handleSave}
            handleCancel={handleCancel}
          />
        ) : (
          <ProfileStatsSection 
            profile={profile}
            learnedCount={learnedCount}
            favoriteCount={favoriteCount}
            streakDays={streakDays}
          />
        )}
      </View>

      <Text variant="bodySmall" style={styles.versionText}>Sign Language App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  versionText: {
    textAlign: 'center',
    paddingVertical: 32,
    opacity: 0.4,
  },
});
