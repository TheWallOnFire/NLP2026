import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Camera } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Fade and slide in text
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      })
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.tertiary, theme.colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.glassCircle}>
            <View style={styles.innerCircle}>
              <Camera size={56} color="#ffffff" strokeWidth={1.5} />
            </View>
          </View>
        </Animated.View>
        
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }],
          alignItems: 'center' 
        }}>
          <Text variant="headlineMedium" style={styles.title}>Handsign</Text>
          <Text variant="headlineMedium" style={styles.titleHighlight}>Detection</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>AI-Powered Sign Language Engine</Text>
          
          <View style={styles.loaderBarContainer}>
            <Animated.View style={styles.loaderProgress} />
          </View>
        </Animated.View>
      </View>
      
      <View style={styles.footer}>
        <Text variant="labelSmall" style={styles.footerText}>POWERED BY NLP 2026</Text>
      </View>
    </LinearGradient>
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
    flex: 1,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 15,
  },
  glassCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: -5,
  },
  titleHighlight: {
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: 40,
  },
  loaderBarContainer: {
    width: width * 0.6,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderProgress: {
    width: '30%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 4,
    fontWeight: '600',
  },
});
