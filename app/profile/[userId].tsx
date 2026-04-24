import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

const getDisplayTime = (createdAt: any) => {
  if (!createdAt) return "";

  let messageDate: Date | null = null;

  if (typeof createdAt?.toDate === "function") {
    messageDate = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    messageDate = createdAt;
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    messageDate = new Date(createdAt);
  } else if (typeof createdAt?.seconds === "number") {
    messageDate = new Date(createdAt.seconds * 1000);
  }

  if (!messageDate || Number.isNaN(messageDate.getTime())) return "";

  return formatDistanceToNow(messageDate, { addSuffix: true });
};

export default function ContactProfileScreen() {
  const router = useRouter();
  const { userId, chatId } = useLocalSearchParams<{
    userId: string;
    chatId?: string;
  }>();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (isMounted && userSnap.exists()) {
          setProfileUser(userSnap.data());
        }
      } finally {
        if (isMounted && !chatId) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [chatId, userId]);

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
      const data = snapshot.data();
      setChatMessages(data?.messages || []);
      setLoading(false);
    });

    return () => unSub();
  }, [chatId]);

  const sharedImages = useMemo(
    () => chatMessages.filter((message) => message.img).reverse(),
    [chatMessages],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Info</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#59b7ff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            <Image
              source={
                profileUser?.avatar
                  ? { uri: profileUser.avatar }
                  : require("../../assets/images/favicon.png")
              }
              style={styles.avatar}
            />
            <Text style={styles.username}>
              {profileUser?.username || "Unknown User"}
            </Text>
            <Text style={styles.email}>
              {profileUser?.email || "No email shared"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{chatMessages.length}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{sharedImages.length}</Text>
              <Text style={styles.statLabel}>Shared Media</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Images</Text>
            {sharedImages.length === 0 ? (
              <View style={styles.emptyMediaCard}>
                <Text style={styles.emptyMediaText}>
                  No shared images in this chat yet.
                </Text>
              </View>
            ) : (
              <View style={styles.mediaGrid}>
                {sharedImages.map((message, index) => (
                  <View key={`${message.img}-${index}`} style={styles.mediaCard}>
                    <Image source={{ uri: message.img }} style={styles.mediaImage} />
                    <Text style={styles.mediaTime}>
                      {getDisplayTime(message.createdAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1115",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#171a21",
    borderBottomWidth: 1,
    borderBottomColor: "#293142",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 26,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 18,
    gap: 16,
  },
  profileCard: {
    backgroundColor: "#171a21",
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#293142",
    marginBottom: 14,
  },
  username: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  email: {
    color: "#97a1b3",
    fontSize: 14,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#171a21",
    borderRadius: 20,
    padding: 18,
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: "#97a1b3",
    fontSize: 13,
    marginTop: 6,
  },
  section: {
    backgroundColor: "#171a21",
    borderRadius: 24,
    padding: 18,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  emptyMediaCard: {
    borderRadius: 18,
    backgroundColor: "#202532",
    padding: 20,
  },
  emptyMediaText: {
    color: "#97a1b3",
    fontSize: 14,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mediaCard: {
    width: "47%",
    backgroundColor: "#202532",
    borderRadius: 16,
    padding: 8,
  },
  mediaImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#293142",
  },
  mediaTime: {
    color: "#97a1b3",
    fontSize: 11,
    marginTop: 8,
  },
});
