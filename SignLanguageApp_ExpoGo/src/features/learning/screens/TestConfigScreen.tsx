import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, useTheme, Card, SegmentedButtons, Appbar } from 'react-native-paper';
import { useModelStore } from '../store/useModelStore';
import { ROUTES } from '../../../constants/routes';
import { triggerSelectionFeedback } from '../../../utils/feedback';

export default function TestConfigScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { packId: initialPackId } = route.params || {};
  const { packs } = useModelStore();
  
  const [selectedPackId, setSelectedPackId] = useState(initialPackId || packs[0]?.id);
  const [duration, setDuration] = useState('60');
  const [mode, setMode] = useState('random');

  const selectedPack = packs.find(p => p.id === selectedPackId);
  const downloadedPacks = packs.filter(p => p.isDownloaded);

  const handleStartTest = () => {
    triggerSelectionFeedback();
    navigation.navigate(ROUTES.TEST, { 
      packId: selectedPackId,
      duration: parseInt(duration),
      mode
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Test Setup" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.label}>Select Pack</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packSelector}>
              {downloadedPacks.map(pack => (
                <Button 
                  key={pack.id}
                  mode={selectedPackId === pack.id ? "contained" : "outlined"}
                  onPress={() => setSelectedPackId(pack.id)}
                  style={styles.packButton}
                >
                  {pack.name}
                </Button>
              ))}
            </ScrollView>

            <Text variant="titleMedium" style={[styles.label, { marginTop: 20 }]}>Test Duration</Text>
            <SegmentedButtons
              value={duration}
              onValueChange={setDuration}
              buttons={[
                { value: '30', label: '30s' },
                { value: '60', label: '60s' },
                { value: '120', label: '120s' },
              ]}
            />

            <Text variant="titleMedium" style={[styles.label, { marginTop: 20 }]}>Test Mode</Text>
            <SegmentedButtons
              value={mode}
              onValueChange={setMode}
              buttons={[
                { value: 'random', label: 'Random' },
                { value: 'new', label: 'New Words' },
                { value: 'weak', label: 'Weak Areas' },
              ]}
            />
          </Card.Content>
        </Card>

        <View style={styles.summary}>
          <Text variant="bodyLarge">Target: {selectedPack?.name}</Text>
          <Text variant="bodyMedium" style={{ color: 'gray' }}>{selectedPack?.wordCount} potential signs to test</Text>
        </View>

        <Button 
          mode="contained" 
          onPress={handleStartTest} 
          style={styles.startButton}
          contentStyle={{ height: 56 }}
          labelStyle={{ fontSize: 18 }}
        >
          Start Test
        </Button>
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  card: {
    padding: 8,
    marginBottom: 20,
  },
  label: {
    marginBottom: 12,
    fontWeight: '600',
  },
  packSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  packButton: {
    marginRight: 8,
  },
  summary: {
    alignItems: 'center',
    marginBottom: 32,
  },
  startButton: {
    borderRadius: 12,
  },
});
