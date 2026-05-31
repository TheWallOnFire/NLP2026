import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Brain } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoadingScreen() {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={[styles.glassCircle, { borderColor: theme.colors.primary }]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Brain size={64} color={theme.colors.primary} />
            </Animated.View>
          </View>
        </Animated.View>
        
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text variant="headlineMedium" style={styles.title}>The Wall On Fire</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>AI Sign Language Engine</Text>
          
          <View style={styles.loaderBar}>
            <Animated.View style={[styles.loaderProgress, { backgroundColor: theme.colors.primary }]} />
          </View>
          
          <Text variant="labelSmall" style={styles.loadingText}>INITIALIZING NEURAL NETWORKS...</Text>
        </Animated.View>
      </View>
      
      <View style={styles.footer}>
        <Text variant="labelSmall" style={styles.footerText}>POWERED BY NLP 2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  glassCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  title: {
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.6,
    letterSpacing: 1,
    marginBottom: 30,
  },
  loaderBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loaderProgress: {
    width: '40%',
    height: '100%',
    borderRadius: 2,
  },
  loadingText: {
    opacity: 0.4,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    opacity: 0.3,
    letterSpacing: 3,
  },
});
