import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, List, useTheme, Button, Card, TextInput, IconButton, Divider, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES } from '../../../constants/routes';
import { History, ChevronRight, Edit2, Check, X, Info, MapPin, Globe, Dot, User as UserIcon, Briefcase, Heart, Sun, Volume2, Camera, Vibrate, HardDrive, Bell, Bug, Database, Download, Cpu } from 'lucide-react-native';
import HistoryTimelineItem from '../../history/components/HistoryTimelineItem';
import { useProfileLogic } from '../hooks/useProfileLogic';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const {
    profile, editedProfile, setEditedProfile, isEditing, setIsEditing,
    learnedCount, favoriteCount, history, handleSave, handleCancel, confirmClearHistory
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
          <Avatar.Icon size={90} icon="account" style={styles.avatar} />
          <IconButton
            icon={() => <Edit2 size={16} color="white" />}
            style={[styles.editAvatarBtn, { backgroundColor: theme.colors.secondary }]}
            onPress={() => { }}
          />
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
        ) : (
          <View style={styles.editForm}>
            <TextInput
              label="Full Name"
              value={editedProfile.name}
              onChangeText={text => setEditedProfile({ ...editedProfile, name: text })}
              mode="flat"
              style={styles.input}
              dense
            />
            <TextInput
              label="Email"
              value={editedProfile.email}
              onChangeText={text => setEditedProfile({ ...editedProfile, email: text })}
              mode="flat"
              style={styles.input}
              dense
            />
            <View style={styles.editActions}>
              <Button mode="elevated" onPress={handleCancel} style={styles.actionBtn}>Cancel</Button>
              <Button mode="contained" onPress={handleSave} style={[styles.actionBtn, {backgroundColor: theme.colors.secondary}]}>Save</Button>
            </View>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statNumber}>{learnedCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Learned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statNumber}>{favoriteCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statNumber}>{history.length}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Detections</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Hoạt động gần đây</Text>
          <Button mode="text" textColor="red" onPress={confirmClearHistory} disabled={history.length === 0}>Xóa</Button>
        </View>

        {history.length > 0 ? (
          history.slice(0, 3).map((item) => (
            <HistoryTimelineItem key={item.id} item={item} />
          ))
        ) : (
          <Card mode="contained" style={styles.activityCard}>
            <Card.Content>
              <Text style={{ textAlign: 'center', opacity: 0.5 }}>No recent activity recorded.</Text>
            </Card.Content>
          </Card>
        )}
        {history.length > 0 && (
          <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => navigation.navigate(ROUTES.HISTORY)}>
            Xem toàn bộ lịch sử
          </Button>
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
});
