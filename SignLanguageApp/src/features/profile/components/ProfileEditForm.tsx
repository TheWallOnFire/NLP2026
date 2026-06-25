import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface ProfileEditFormProps {
  editedProfile: any;
  setEditedProfile: (profile: any) => void;
  errors: any;
  handleSave: () => void;
  handleCancel: () => void;
}

export default function ProfileEditForm({
  editedProfile,
  setEditedProfile,
  errors,
  handleSave,
  handleCancel
}: ProfileEditFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.editForm}>
      <TextInput
        label={t('profile.fullName')}
        value={editedProfile.name}
        onChangeText={text => setEditedProfile({ ...editedProfile, name: text })}
        mode="outlined"
        style={styles.input}
        error={!!errors.name}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      
      <TextInput
        label={t('profile.email')}
        value={editedProfile.email}
        onChangeText={text => setEditedProfile({ ...editedProfile, email: text })}
        mode="outlined"
        style={styles.input}
        error={!!errors.email}
        keyboardType="email-address"
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      
      <TextInput
        label={t('profile.birth')}
        value={editedProfile.birth}
        onChangeText={text => setEditedProfile({ ...editedProfile, birth: text })}
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label={t('profile.location')}
        value={editedProfile.location}
        onChangeText={text => setEditedProfile({ ...editedProfile, location: text })}
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label={t('profile.bio')}
        value={editedProfile.bio}
        onChangeText={text => setEditedProfile({ ...editedProfile, bio: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <TextInput
        label={t('profile.goals')}
        value={editedProfile.learningGoal}
        onChangeText={text => setEditedProfile({ ...editedProfile, learningGoal: text })}
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label={t('profile.motivation')}
        value={editedProfile.motivation}
        onChangeText={text => setEditedProfile({ ...editedProfile, motivation: text })}
        mode="outlined"
        style={styles.input}
      />
      
      <View style={styles.editActions}>
        <Button mode="elevated" onPress={handleCancel} style={styles.actionBtn}>
          {t('profile.cancel')}
        </Button>
        <Button mode="contained" onPress={handleSave} style={[styles.actionBtn, {backgroundColor: theme.colors.secondary}]}>
          {t('profile.save')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editForm: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});
