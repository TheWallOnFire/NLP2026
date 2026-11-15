import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>Oops, something went wrong.</Text>
          <ScrollView style={styles.errorBox} contentContainerStyle={styles.errorContent}>
            <Text variant="bodyMedium" style={styles.message}>
              {this.state.error?.message || "An unexpected error occurred in the application."}
            </Text>
          </ScrollView>
          <Button 
            mode="contained" 
            onPress={() => this.setState({ hasError: false, error: null })}
            style={styles.button}
          >
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#121212',
  },
  title: {
    color: '#EF5350',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorBox: {
    maxHeight: 160,
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 20,
    padding: 12,
  },
  errorContent: {
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    color: '#E0E0E0',
  },
  button: {
    paddingHorizontal: 24,
    borderRadius: 24,
  }
});
