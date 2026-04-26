import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRootNavigationState, useRouter } from "expo-router";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";
import { useChatStore } from "../store/chatStore";
import { useUserStore } from "../store/userStore";
import AddUser from "./AddUser";

const UserList = () => {
  const [modalShow, setModalShow] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser?.id) return;

    const unSub = onSnapshot(
      doc(db, "userChats", currentUser.id),
      async (res) => {
        if (!res.exists()) {
          setChats([]);
          setLoading(false);
          return;
        }

        const items = res.data().chats || [];
        const promises = items.map(async (item: any) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          return userDocSnap.exists()
            ? { ...item, user: userDocSnap.data() }
            : null;
        });

        const chatData = (await Promise.all(promises)).filter(Boolean);
        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        setLoading(false);
      },
    );

    return () => unSub();
  }, [currentUser?.id]);

  const rootNavigationState = useRootNavigationState();

  const handleSelect = (chat: any) => {
    if (!rootNavigationState?.key) return;

    changeChat(chat.chatId, chat.user);

    requestAnimationFrame(() => {
      router.push(`/chat/${chat.chatId}`);
    });
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(searchInput.toLowerCase()),
  );

  if (loading)
    return (
      <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#fff" />
    );

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="white"
            style={{ opacity: 0.7 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search...."
            placeholderTextColor="rgba(255,255,255,0.7)"
            onChangeText={setSearchInput}
            value={searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.plusIcon}
          onPress={() => setModalShow(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.chatId}
        renderItem={({ item }) => {
          const content = (
            <View style={styles.userItemContent}>
              <Image
                source={
                  item.user?.avatar
                    ? { uri: item.user.avatar }
                    : require("../assets/images/favicon.png")
                }
                style={styles.avatar}
              />
              <View style={styles.userTexts}>
                <Text style={styles.username}>{item.user?.username}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            </View>
          );

          return (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.88}
            >
              {item.isSeen ? (
                <View style={styles.readUserItem}>{content}</View>
              ) : (
                <BlurView
                  intensity={42}
                  tint="light"
                  experimentalBlurMethod="dimezisBlurView"
                  style={styles.unreadUserItem}
                >
                  <View style={styles.unreadOverlay} />
                  {content}
                </BlurView>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <AddUser visible={modalShow} onClose={() => setModalShow(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: "#f8fbff",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  plusIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    borderRadius: 16,
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  userItem: {
    overflow: "hidden",
    borderRadius: 20,
    marginHorizontal: 14,
    marginVertical: 5,
  },
  userItemContent: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    gap: 14,
  },
  readUserItem: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  unreadUserItem: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  unreadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(116, 113, 113, 0.08)",
    borderLeftColor: "#53acfb",
    borderLeftWidth: 4,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userTexts: { flex: 1 },
  username: { fontWeight: "700", fontSize: 18, color: "#0e3e7c" },
  lastMessage: { color: "rgba(57, 63, 72, 0.82)", fontSize: 15 },
});

export default UserList;
