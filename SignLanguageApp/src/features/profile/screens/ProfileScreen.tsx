import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Avatar, List, useTheme, Button, Card, TextInput, IconButton, Divider, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES } from '../../../constants/routes';
import { History, ChevronRight, Edit2, Check, X, Info, MapPin, Globe, Dot, User as UserIcon, Briefcase, Heart, Sun, Volume2, Camera, Vibrate, HardDrive, Bell, Bug, Database, Download, Cpu } from 'lucide-react-native';
import HistoryTimelineItem from '../../history/components/HistoryTimelineItem';
import { useProfileLogic } from '../hooks/useProfileLogic';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    profile, editedProfile, setEditedProfile, isEditing, setIsEditing,
    learnedCount, favoriteCount, streakDays, handleSave, handleCancel, handlePickImage, errors
  } = useProfileLogic();

  const BulletItem = ({ label, value, icon }: { label: string, value: string, icon?: any }) => (
    <View style={styles.bulletItem}>
      {icon ? icon : <Dot size={20} color={theme.colors.primary} />}
      <Text variant="bodyMedium" style={styles.bulletLabel}>{label}:</Text>
      <Text variant="bodyMedium" style={styles.bulletValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

      <View style={styles.section}>
        {isEditing ? (
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
              <Button mode="elevated" onPress={handleCancel} style={styles.actionBtn}>{t('profile.cancel')}</Button>
              <Button mode="contained" onPress={handleSave} style={[styles.actionBtn, {backgroundColor: theme.colors.secondary}]}>{t('profile.save')}</Button>
            </View>
          </View>
        ) : (
          <View style={styles.statsSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>{t('profile.activityStats')}</Text>
            
            <Card style={styles.statsCard} mode="outlined">
              <Card.Content>
                <View style={styles.statRowInsight}>
                  <View style={styles.statInsightItem}>
                    <Text variant="displaySmall" style={styles.statInsightValue}>{learnedCount}</Text>
                    <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.learnedWords')}</Text>
                  </View>
                  <View style={styles.statDividerVertical} />
                  <View style={styles.statInsightItem}>
                    <Text variant="displaySmall" style={styles.statInsightValue}>{favoriteCount}</Text>
                    <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.favoriteWords')}</Text>
                  </View>
                </View>
                <Divider style={{ marginVertical: 16 }} />
                <View style={styles.statRowInsight}>
                  <View style={styles.statInsightItem}>
                    <Text variant="displaySmall" style={styles.statInsightValue}>{Math.round((profile.learningTime || 0) / 60)}h</Text>
                    <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.learningTime')}</Text>
                  </View>
                  <View style={styles.statDividerVertical} />
                  <View style={styles.statInsightItem}>
                    <Text variant="displaySmall" style={styles.statInsightValue}>{streakDays}</Text>
                    <Text variant="labelMedium" style={styles.statInsightLabel}>{t('profile.streakDays')}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>{t('profile.aboutMe')}</Text>
            <Card style={styles.infoCard} mode="contained">
              <Card.Content>
                <BulletItem label={t('profile.birth')} value={profile.birth || 'N/A'} icon={<UserIcon size={16} color={theme.colors.primary} />} />
                <BulletItem label={t('profile.bio')} value={profile.bio || 'N/A'} icon={<Info size={16} color={theme.colors.primary} />} />
                <BulletItem label={t('profile.goals')} value={profile.learningGoal || 'N/A'} icon={<Briefcase size={16} color={theme.colors.primary} />} />
                <BulletItem label={t('profile.motivation')} value={profile.motivation || 'N/A'} icon={<Heart size={16} color={theme.colors.primary} />} />
              </Card.Content>
            </Card>
          </View>
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
  bioText: {
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 18,
  },
  editForm: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    opacity: 0.8,
    color: 'white',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    marginBottom: 8,
    opacity: 0.6,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityCard: {
    borderRadius: 12,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bulletLabel: {
    fontWeight: 'bold',
    marginLeft: 4,
    width: 130,
  },
  bulletValue: {
    flex: 1,
    opacity: 0.8,
  },
  versionText: {
    textAlign: 'center',
    paddingVertical: 32,
    opacity: 0.4,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsCard: {
    borderRadius: 16,
    padding: 8,
  },
  statRowInsight: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statInsightItem: {
    alignItems: 'center',
    flex: 1,
  },
  statInsightValue: {
    fontWeight: 'bold',
    color: '#005bea',
  },
  statInsightLabel: {
    opacity: 0.6,
    marginTop: 4,
  },
  statDividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  infoCard: {
    borderRadius: 16,
    paddingVertical: 8,
  },
});
