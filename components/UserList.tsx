import { Ionicons } from "@expo/vector-icons";
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

  const handleSelect = async (chat: any) => {
    changeChat(chat.chatId, chat.user);
    // Add logic here to navigate to chat room if needed
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(searchInput.toLowerCase()),
  );

  if (loading)
    return <ActivityIndicator style={{ marginTop: 20 }} size="large" />;

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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userItem,
              { backgroundColor: item.isSeen ? "transparent" : "#5183fe" },
            ]}
            onPress={() => handleSelect(item)}
          >
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
          </TouchableOpacity>
        )}
      />

      <AddUser visible={modalShow} onClose={() => setModalShow(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { flexDirection: "row", padding: 10, gap: 10, alignItems: "center" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#7f7e7e",
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    height: 45,
  },
  searchInput: { flex: 1, color: "white", marginLeft: 5 },
  plusIcon: {
    backgroundColor: "#7f7e7e",
    borderRadius: 10,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  userItem: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    gap: 15,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userTexts: { flex: 1 },
  username: { fontWeight: "bold", fontSize: 16 },
  lastMessage: { color: "gray", fontSize: 14 },
});

export default UserList;
