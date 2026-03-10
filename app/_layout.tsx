import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/contexts/AppContext";
import LoginScreen from "@/app/login";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

const TOKEN_KEY = "vitalis_jwt";

function RootLayoutNav() {
  const { data, isLoading, addUser } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading || checkingAuth || checkedRef.current) return;
    checkedRef.current = true;

    if (data.users.length === 0) {
      setShowLogin(true);
    }
  }, [isLoading, checkingAuth, data.users.length]);

  async function checkStoredAuth() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        const payload = parseJwt(token);
        if (payload && payload.exp * 1000 > Date.now()) {
          setCheckingAuth(false);
          return;
        }
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {}
    setCheckingAuth(false);
  }

  const handleAuth = async (userData: any, token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (data.users.length === 0) {
      await addUser({
        name: userData.name || userData.username,
        age: userData.age || 25,
        gender: userData.gender || "other",
        height: userData.height || 175,
        weight: userData.weight || 75,
        goalWeight: userData.goalWeight || 70,
        activityLevel: userData.activityLevel || "moderate",
        goal: userData.goal || "maintain",
      });
    }
    setShowLogin(false);
    router.replace("/onboarding");
  };

  if (showLogin) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="calculator" options={{ headerShown: false }} />
      <Stack.Screen name="supplements" options={{ headerShown: false }} />
      <Stack.Screen name="breathing" options={{ headerShown: false }} />
      <Stack.Screen name="challenges" options={{ headerShown: false }} />
      <Stack.Screen name="hairstyle" options={{ headerShown: false }} />
      <Stack.Screen name="shopping" options={{ headerShown: false }} />
      <Stack.Screen name="workout-session" options={{ headerShown: false }} />
      <Stack.Screen name="add-account" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="steps" options={{ headerShown: false }} />
    </Stack>
  );
}

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = typeof atob !== "undefined"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
