import { Stack, useRouter, useSegments } from "expo-router"; // Add these
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { authentication } from "../firebaseConfig";
import { useUserStore } from "../store/userStore";

export default function RootLayout() {
  const { fetchUserInfo, isLoading, currentUser } = useUserStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unSub = onAuthStateChanged(authentication, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => unSub();
  }, []);

  // 2. Navigation "Gatekeeper"
  // This effect runs every time the user state or the current screen changes
  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";

    if (currentUser && !inTabsGroup) {
      // User is logged in but NOT in the tabs folder -> Redirect to Home
      router.replace("/(tabs)");
    } else if (!currentUser && inTabsGroup) {
      // User is NOT logged in but IS in the tabs folder -> Redirect to Login
      router.replace("/login");
    }
  }, [currentUser, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
