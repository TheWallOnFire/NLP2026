import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, List, Divider, useTheme, Button, Card } from 'react-native-paper';
import { ROUTES } from '../../../constants/routes';
import { User, History, Settings, Shield, CircleHelp, LogOut, ChevronRight } from 'lucide-react-native';
import { useLearningStore } from '../../learning/store/useLearningStore';

export default function ProfileScreen({ navigation }: any) {
  const theme = useTheme();
  const packWords = useLearningStore(state => state.packWords);
  
  const learnedCount = Object.values(packWords).flat().filter(w => w.learned).length;
  const favoriteCount = Object.values(packWords).flat().filter(w => w.favorite).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Avatar.Icon size={80} icon="account" style={styles.avatar} />
        <Text variant="headlineSmall" style={styles.userName}>Signer Pro</Text>
        <Text variant="bodyMedium" style={styles.userEmail}>signer.pro@example.com</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statNumber}>{learnedCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Learned</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statNumber}>{favoriteCount}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text variant="titleLarge" style={styles.statNumber}>12</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Tests</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>Activity</Text>
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
        <Text variant="labelLarge" style={styles.sectionTitle}>Account Settings</Text>
        <Card mode="contained" style={styles.menuCard}>
          <List.Item
            title="Personal Information"
            left={props => <User {...props} color={theme.colors.onSurfaceVariant} size={20} />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Security"
            left={props => <Shield {...props} color={theme.colors.onSurfaceVariant} size={20} />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Preferences"
            left={props => <Settings {...props} color={theme.colors.onSurfaceVariant} size={20} />}
            onPress={() => navigation.navigate(ROUTES.SETTINGS)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>Support</Text>
        <Card mode="contained" style={styles.menuCard}>
          <List.Item
            title="Help Center"
            left={props => <CircleHelp {...props} color={theme.colors.onSurfaceVariant} size={20} />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Sign Out"
            titleStyle={{ color: theme.colors.error }}
            left={props => <LogOut {...props} color={theme.colors.error} size={20} />}
            onPress={() => {}}
          />
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
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    opacity: 0.6,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 32,
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
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
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
  icon: {
    marginRight: 8,
    alignSelf: 'center',
  },
  versionText: {
    textAlign: 'center',
    padding: 32,
    opacity: 0.4,
  },
});
