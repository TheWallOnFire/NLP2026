import * as React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Avatar, List, useTheme, Button, Card, TextInput, IconButton, Divider } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { History, ChevronRight, Edit2, Check, X, Info, MapPin, Globe } from 'lucide-react-native';
import { useLearningStore } from '../../learning/store/useLearningStore';
import { useUserStore } from '../store/useUserStore';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const packWords = useLearningStore(state => state.packWords);
  const { profile, updateProfile } = useUserStore();
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedProfile, setEditedProfile] = React.useState(profile);

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

            <Text variant="bodySmall" style={styles.bioText}>{profile.bio}</Text>
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
            <View style={styles.row}>
              <TextInput
                label="Age"
                value={editedProfile.age}
                onChangeText={text => setEditedProfile({...editedProfile, age: text})}
                mode="outlined"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                keyboardType="numeric"
                dense
              />
              <TextInput
                label="Email"
                value={editedProfile.email}
                onChangeText={text => setEditedProfile({...editedProfile, email: text})}
                mode="outlined"
                style={[styles.input, { flex: 2 }]}
                dense
              />
            </View>
            <View style={styles.row}>
              <TextInput
                label="Location"
                value={editedProfile.location}
                onChangeText={text => setEditedProfile({...editedProfile, location: text})}
                mode="outlined"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                dense
              />
              <TextInput
                label="Native Language"
                value={editedProfile.nativeLanguage}
                onChangeText={text => setEditedProfile({...editedProfile, nativeLanguage: text})}
                mode="outlined"
                style={[styles.input, { flex: 1 }]}
                dense
              />
            </View>
            <TextInput
              label="Bio / Summary"
              value={editedProfile.bio}
              onChangeText={text => setEditedProfile({...editedProfile, bio: text})}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
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
            <Text variant="titleLarge" style={styles.statNumber}>12</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Tests</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>Quick Access</Text>
        <Card mode="contained" style={styles.menuCard}>
          <List.Item
            title="Learning History"
            description="View your past signs and test scores"
            left={props => <History {...props} color={theme.colors.primary} size={24} />}
            right={props => <ChevronRight {...props} color={theme.colors.outline} size={20} />}
            onPress={() => navigation.navigate(ROUTES.HISTORY)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>Learning Tips</Text>
        <Card mode="elevated" style={[styles.tipCard, { backgroundColor: theme.colors.secondaryContainer }]}>
          <Card.Content style={styles.tipContent}>
            <Info size={24} color={theme.colors.onSecondaryContainer} />
            <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onSecondaryContainer }]}>
              Practice daily for at least 15 minutes to build muscle memory for sign language!
            </Text>
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
  },
  tipCard: {
    borderRadius: 16,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    marginLeft: 16,
    lineHeight: 20,
  },
  versionText: {
    textAlign: 'center',
    paddingVertical: 32,
    opacity: 0.4,
  },
});
