import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { SessionProvider, useSession } from "@/context/SessionContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { UserManagementProvider } from "@/context/UserManagementContext";
import { useColors } from "@/hooks/useColors";
import LoginScreen from "./login";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cases/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="cases/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="violations/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notes/add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="ordinances/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="notices/generate" options={{ headerShown: true }} />
      <Stack.Screen name="notices/preview" options={{ headerShown: true }} />
      <Stack.Screen name="notices/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="admin/users" options={{ headerShown: true }} />
      <Stack.Screen name="admin/roles" options={{ headerShown: true }} />
      <Stack.Screen name="admin/audit" options={{ headerShown: true }} />
      <Stack.Screen name="admin/tenants" options={{ headerShown: true }} />
    </Stack>
  );
}

function AppShell() {
  const { session, isSessionLoaded } = useSession();
  const colors = useColors();

  if (!isSessionLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <UserManagementProvider>
      <AppProvider>
        <GestureHandlerRootView>
          <KeyboardProvider>
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </AppProvider>
    </UserManagementProvider>
  );
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
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <SessionProvider>
              <AppShell />
            </SessionProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
