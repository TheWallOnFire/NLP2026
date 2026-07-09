import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { VideoPlayer } from 'expo-video';
import { Play, Pause, Rewind, FastForward, Activity } from 'lucide-react-native';

interface VideoControllerProps {
  player: VideoPlayer;
}

export default function VideoController({ player }: VideoControllerProps) {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(player.playing);
  const [speed, setSpeed] = useState(player.playbackRate || 1.0);

  useEffect(() => {
    // Sync React state with player state (simplified)
    const interval = setInterval(() => {
      setIsPlaying(player.playing);
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const seekBackward = () => {
    player.seekBy(-5);
  };

  const seekForward = () => {
    player.seekBy(5);
  };

  const cycleSpeed = () => {
    const newSpeed = speed === 1.0 ? 1.5 : speed === 1.5 ? 2.0 : speed === 2.0 ? 0.5 : 1.0;
    player.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity onPress={seekBackward} style={styles.btn}>
        <Rewind color="white" size={24} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={togglePlay} style={[styles.btn, styles.playBtn, { backgroundColor: theme.colors.primary }]}>
        {isPlaying ? <Pause color="white" size={28} /> : <Play color="white" size={28} style={{ marginLeft: 4 }} />}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={seekForward} style={styles.btn}>
        <FastForward color="white" size={24} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={cycleSpeed} style={styles.speedBtn}>
        <Text style={styles.speedText}>{speed}x</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 20,
    zIndex: 999,
    elevation: 10,
  },
  btn: {
    padding: 8,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginLeft: 10,
  },
  speedText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
