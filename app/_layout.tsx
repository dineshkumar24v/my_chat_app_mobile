import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { authentication } from "../firebaseConfig";
import { useUserStore } from "../store/userStore";

export default function RootLayout() {
  const { fetchUserInfo, isLoading, currentUser } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const inTabsGroup = segments[0] === "(tabs)";
  const inChatGroup = segments[0] === "chat";
  const inProfileGroup = segments[0] === "profile";

  useEffect(() => {
    const unSub = onAuthStateChanged(authentication, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => unSub();
  }, [fetchUserInfo]);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (currentUser && !inTabsGroup && !inChatGroup && !inProfileGroup) {
        router.replace("/(tabs)");
      } else if (
        !currentUser &&
        segments[0] !== "login" &&
        segments[0] !== "signup"
      ) {
        router.replace("/login");
      }
    }, 1);

    return () => clearTimeout(timer);
  }, [currentUser, inChatGroup, inProfileGroup, inTabsGroup, isLoading, router, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#53acfb" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="chat/details" />
        <Stack.Screen name="profile/[userId]" />
      </Stack>
    </SafeAreaProvider>
  );
}
