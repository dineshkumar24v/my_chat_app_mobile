import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authentication, db } from "../../firebaseConfig";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useUserStore } from "../../store/userStore";

const formatJoinedDate = (value: any) => {
  if (!value) return "Recently joined";

  let joinedDate: Date | null = null;

  if (typeof value?.toDate === "function") {
    joinedDate = value.toDate();
  } else if (value instanceof Date) {
    joinedDate = value;
  } else if (typeof value === "number" || typeof value === "string") {
    joinedDate = new Date(value);
  }

  if (!joinedDate || Number.isNaN(joinedDate.getTime())) return "Recently joined";

  return joinedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function SettingsScreen() {
  const systemTheme = useColorScheme() ?? "dark";
  const { currentUser, setCurrentUser } = useUserStore();
  const [darkModePreview, setDarkModePreview] = useState(systemTheme === "dark");
  const [totalMessagesSent, setTotalMessagesSent] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    setDarkModePreview(systemTheme === "dark");
  }, [systemTheme]);

  useEffect(() => {
    if (!currentUser?.id) {
      setTotalMessagesSent(0);
      setChatCount(0);
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);

    const userChatsRef = doc(db, "userChats", currentUser.id);
    const unSub = onSnapshot(userChatsRef, async (snapshot) => {
      const chatEntries = snapshot.exists() ? snapshot.data().chats || [] : [];
      setChatCount(chatEntries.length);

      try {
        const chatDocs = await Promise.all(
          chatEntries.map((entry: { chatId: string }) =>
            getDoc(doc(db, "chats", entry.chatId)),
          ),
        );

        const sentCount = chatDocs.reduce((total, chatDoc) => {
          if (!chatDoc.exists()) return total;

          const messages = chatDoc.data().messages || [];
          const mine = messages.filter(
            (message: { senderId?: string }) => message.senderId === currentUser.id,
          ).length;

          return total + mine;
        }, 0);

        setTotalMessagesSent(sentCount);
      } catch (error) {
        console.log(error);
        setTotalMessagesSent(0);
      } finally {
        setStatsLoading(false);
      }
    });

    return () => unSub();
  }, [currentUser?.id]);

  const palette = useMemo(
    () =>
      darkModePreview
        ? {
            screen: "#0f1115",
            card: "#171a21",
            cardAlt: "#202532",
            text: "#f5f7fb",
            muted: "#97a1b3",
            border: "#293142",
            accent: "#59b7ff",
            accentSoft: "#133a55",
            danger: "#d94b4b",
          }
        : {
            screen: "#f4f7fb",
            card: "#ffffff",
            cardAlt: "#eef4fb",
            text: "#132033",
            muted: "#607089",
            border: "#d9e3ef",
            accent: "#0f7ae5",
            accentSoft: "#d9ebff",
            danger: "#cf3648",
          },
    [darkModePreview],
  );

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(authentication);
            setCurrentUser(null);
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Could not log out right now.");
          }
        },
      },
    ]);
  };

  const uploadAvatarToCloudinary = async (uri: string) => {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);
    data.append("upload_preset", "ReactChatAppUploads");
    data.append("cloud_name", "dmrgvxawa");

    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dmrgvxawa/image/upload",
      data,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    return response.data.secure_url as string;
  };

  const handleAvatarUpdate = async () => {
    if (!currentUser?.id || avatarLoading) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled) return;

    setAvatarLoading(true);
    try {
      const pickedUri = result.assets[0].uri;
      const uploadUri =
        Platform.OS === "ios" ? pickedUri.replace("file://", "") : pickedUri;
      const avatarUrl = await uploadAvatarToCloudinary(uploadUri);

      await updateDoc(doc(db, "users", currentUser.id), {
        avatar: avatarUrl,
      });

      setCurrentUser({ ...currentUser, avatar: avatarUrl });
      Alert.alert("Success", "Profile photo updated.");
    } catch (error) {
      console.error("Avatar update error:", error);
      Alert.alert("Upload Failed", "Could not update your profile photo.");
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>
            No profile loaded
          </Text>
          <Text style={[styles.emptyCopy, { color: palette.muted }]}>
            Sign in to view your profile, stats, and preferences.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: palette.card }]}>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={handleAvatarUpdate}
            activeOpacity={0.85}
            disabled={avatarLoading}
          >
            <View style={[styles.profileRing, { borderColor: palette.accent }]}>
              <Image
                source={
                  currentUser.avatar
                    ? { uri: currentUser.avatar }
                    : require("../../assets/images/favicon.png")
                }
                style={styles.avatar}
              />
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: palette.accent },
                ]}
              >
                {avatarLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          <Text style={[styles.avatarHint, { color: palette.muted }]}>
            Tap photo to update
          </Text>

          <Text style={[styles.name, { color: palette.text }]}>
            {currentUser.username || "Chat User"}
          </Text>
          <Text style={[styles.email, { color: palette.muted }]}>
            {currentUser.email || "No email available"}
          </Text>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name="calendar-outline" size={16} color={palette.accent} />
              <Text style={[styles.badgeText, { color: palette.accent }]}>
                Joined {formatJoinedDate(currentUser.timeStamp)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: palette.cardAlt }]}>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {statsLoading ? "..." : totalMessagesSent}
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Total Messages Sent
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: palette.cardAlt }]}>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {statsLoading ? "..." : chatCount}
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Active Conversations
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Preferences
          </Text>

          <View
            style={[
              styles.preferenceRow,
              { borderBottomColor: palette.border },
            ]}
          >
            <View style={styles.preferenceTextWrap}>
              <Text style={[styles.preferenceTitle, { color: palette.text }]}>
                Dark Mode Preview
              </Text>
              <Text style={[styles.preferenceCopy, { color: palette.muted }]}>
                Try the darker look for this settings screen.
              </Text>
            </View>
            <Switch
              value={darkModePreview}
              onValueChange={setDarkModePreview}
              trackColor={{ false: "#c5d2e3", true: palette.accent }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={[styles.preferenceTitle, { color: palette.text }]}>
                Blocked Users
              </Text>
              <Text style={[styles.preferenceCopy, { color: palette.muted }]}>
                {currentUser.blocked?.length || 0} users are currently blocked.
              </Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={24} color={palette.accent} />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Account
          </Text>

          <View
            style={[
              styles.accountRow,
              { borderBottomColor: palette.border },
            ]}
          >
            <Text style={[styles.accountLabel, { color: palette.muted }]}>
              Username
            </Text>
            <Text style={[styles.accountValue, { color: palette.text }]}>
              {currentUser.username || "Not set"}
            </Text>
          </View>

          <View
            style={[
              styles.accountRow,
              { borderBottomColor: palette.border },
            ]}
          >
            <Text style={[styles.accountLabel, { color: palette.muted }]}>
              Email
            </Text>
            <Text style={[styles.accountValue, { color: palette.text }]}>
              {currentUser.email || "Not set"}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: palette.danger }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  profileRing: {
    borderWidth: 3,
    borderRadius: 52,
    padding: 4,
  },
  avatarButton: {
    marginBottom: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#c7d2e0",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: {
    fontSize: 13,
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
  },
  email: {
    fontSize: 15,
    marginTop: 6,
  },
  badgesRow: {
    flexDirection: "row",
    marginTop: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  preferenceTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  preferenceCopy: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  accountRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  accountLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  emptyCopy: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
});
