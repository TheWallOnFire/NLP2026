import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, List, useTheme, Button, Card, TextInput, IconButton, Divider } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { History, ChevronRight, Edit2, Check, X, Info, MapPin, Globe, Dot, User as UserIcon, Briefcase, Heart } from 'lucide-react-native';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useUserStore } from '../store/useUserStore';
import { useHistoryStore } from '../../history/store/useHistoryStore';
import HistoryTimelineItem from '../../history/components/HistoryTimelineItem';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const packWords = useLearningStore(state => state.packWords);
  const { profile, updateProfile } = useUserStore();
  const { history, clearHistory } = useHistoryStore();
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedProfile, setEditedProfile] = React.useState(profile);

  React.useEffect(() => {
    setEditedProfile(profile);
  }, [profile]);

  const learnedCount = Object.values(packWords).flat().filter(w => w.learned).length;
  const favoriteCount = Object.values(packWords).flat().filter(w => w.favorite).length;

  const handleSave = () => {
    updateProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Delete all activity history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: clearHistory }
      ]
    );
  };

  const BulletItem = ({ label, value, icon }: { label: string, value: string, icon?: any }) => (
    <View style={styles.bulletItem}>
      {icon ? icon : <Dot size={20} color={theme.colors.primary} />}
      <Text variant="bodyMedium" style={styles.bulletLabel}>{label}:</Text>
      <Text variant="bodyMedium" style={styles.bulletValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Icon size={80} icon="account" style={styles.avatar} />
          <IconButton
            icon={() => <Edit2 size={16} color="white" />}
            style={[styles.editAvatarBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => {}}
          />
        </View>

        {!isEditing ? (
          <>
            <View style={styles.nameRow}>
              <Text variant="headlineSmall" style={styles.userName}>{profile.name}</Text>
              <IconButton icon={() => <Edit2 size={18} color={theme.colors.primary} />} onPress={() => setIsEditing(true)} />
            </View>
            <Text variant="bodyMedium" style={styles.userEmail}>{profile.email}</Text>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MapPin size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.detailText}>{profile.location}</Text>
              </View>
              <View style={styles.detailItem}>
                <Globe size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.detailText}>{profile.nativeLanguage}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              label="Full Name"
              value={editedProfile.name}
              onChangeText={text => setEditedProfile({...editedProfile, name: text})}
              mode="outlined"
              style={styles.input}
              dense
            />
            <TextInput
              label="Email"
              value={editedProfile.email}
              onChangeText={text => setEditedProfile({...editedProfile, email: text})}
              mode="outlined"
              style={styles.input}
              dense
            />
            <View style={styles.editActions}>
              <Button mode="outlined" onPress={handleCancel} icon={() => <X size={16} />} style={styles.actionBtn}>Cancel</Button>
              <Button mode="contained" onPress={handleSave} icon={() => <Check size={16} />} style={styles.actionBtn}>Save</Button>
            </View>
          </View>
        )}
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statNumber}>{learnedCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Learned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statNumber}>{favoriteCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statNumber}>{history.length}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Detections</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Activity History</Text>
          <Button mode="text" textColor="red" onPress={confirmClearHistory} disabled={history.length === 0}>Clear</Button>
        </View>
        
        {history.length > 0 ? (
          history.slice(0, 5).map((item) => (
            <HistoryTimelineItem key={item.id} item={item} />
          ))
        ) : (
          <Card mode="contained" style={styles.activityCard}>
            <Card.Content>
              <Text style={{ textAlign: 'center', opacity: 0.5 }}>No recent activity recorded.</Text>
            </Card.Content>
          </Card>
        )}
        {history.length > 5 && (
          <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => navigation.navigate(ROUTES.HISTORY)}>
            View All History
          </Button>
        )}
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>Account Details</Text>
        <Card mode="contained" style={styles.menuCard}>
          <Card.Content>
            <BulletItem label="Level" value={profile.level} />
            <BulletItem label="Hand" value={profile.preferredHand} />
            <BulletItem label="Occupation" value={profile.occupation} icon={<Briefcase size={18} color={theme.colors.primary} style={{ marginRight: 4 }} />} />
          </Card.Content>
        </Card>
      </View>

      <Text variant="bodySmall" style={styles.versionText}>Sign Language App v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
  },
  userEmail: {
    opacity: 0.6,
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
  },
  statLabel: {
    opacity: 0.6,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
