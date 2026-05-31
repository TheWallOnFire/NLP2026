# Sign Language App - Expo Go Documentation

Welcome to the documentation for the **Expo Go Edition** of the Sign Language App.

## Overview
This specific version of the application (`SignLanguageApp_ExpoGo`) is tailored to run directly within the Expo Go sandbox environment. It acts as a lightweight, frontend-focused pipeline for rapid UI/UX prototyping and development without the overhead of native C++ compilation.

## Documentation Index
Please explore the following documents to understand the details of this project:

1. [Architecture & State Management](./architecture.md)
   * Explains how the app is structured, navigation flow, and how Zustand is used for state management.
2. [Features & UI Components](./features.md)
   * Details the core features such as the Camera feed, Profile page, Model UI picker, and Text-to-Speech integration.
3. [Machine Learning Pipeline](./ml-pipeline.md)
   * Details the offline ML strategy used in this Expo Go environment (the "Bounding Box" + TensorFlow.js approach) versus the mock data currently used for UI testing.

## Why an Expo Go Edition?
Developing directly with native AI libraries (`react-native-vision-camera`, `react-native-fast-tflite`) requires frequent, slow native rebuilds (`npx expo run:android`). By maintaining this Expo Go version, you can instantly test UI, navigation, and logic changes via over-the-air (OTA) updates using the standard Expo Go app.
