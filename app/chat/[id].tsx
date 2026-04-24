import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Use SafeAreaView here, NOT Provider
import { SafeAreaView } from "react-native-safe-area-context";

import { StatusBar } from "expo-status-bar";
import ChatDetails from "../../components/ChatDetails";
import { db } from "../../firebaseConfig";
import { useChatStore } from "../../store/chatStore";
import { useUserStore } from "../../store/userStore";

const EMOJI_GROUPS = [
  ["😀", "😂", "😍", "🥳", "😎", "😭", "😡", "🙏"],
  ["👍", "👏", "🙌", "🤝", "💙", "🔥", "✨", "🎉"],
  ["❤️", "😊", "😉", "🤔", "😴", "🤗", "🥰", "😅"],
];

const getRelativeMessageTime = (createdAt: any) => {
  if (!createdAt) return "";

  let messageDate: Date | null = null;

  if (typeof createdAt?.toDate === "function") {
    messageDate = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    messageDate = createdAt;
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    messageDate = new Date(createdAt);
  } else if (
    typeof createdAt?.seconds === "number" &&
    typeof createdAt?.nanoseconds === "number"
  ) {
    messageDate = new Date(createdAt.seconds * 1000);
  }

  if (!messageDate || Number.isNaN(messageDate.getTime())) return "";

  return formatDistanceToNow(messageDate, { addSuffix: true });
};

const ChatRoom = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { user, isReceiverBlocked, isCurrentUserBlocked } = useChatStore();

  const [chat, setChat] = useState<any>(null);
  const [writeText, setWriteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [emojiVisible, setEmojiVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;

    const unSub = onSnapshot(doc(db, "chats", id as string), (res) => {
      setChat(res.data());
    });

    return () => unSub();
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chat?.messages?.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [chat?.messages]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        if (chat?.messages?.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 200);
    });

    return () => subscription.remove();
  }, [chat?.messages]);

  const pickImage = async () => {
    if (isCurrentUserBlocked || isReceiverBlocked) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadAndSendImage(result.assets[0].uri);
    }
  };

  const uploadAndSendImage = async (uri: string) => {
    setLoading(true);
    try {
      const data = new FormData();
      data.append("file", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any);
      data.append("upload_preset", "ReactChatAppUploads");
      data.append("cloud_name", "dmrgvxawa");

      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dmrgvxawa/image/upload",
        data,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      await sendMessage(res.data.secure_url, "");
    } catch (err) {
      console.error("Cloudinary Error:", err);
      Alert.alert(
        "Upload Failed",
        "Check your Cloudinary preset and cloud name.",
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (imgUrl: string | null = null, text: string) => {
    if (!text && !imgUrl) return;

    const chatIdStr = id as string;
    try {
      await updateDoc(doc(db, "chats", chatIdStr), {
        messages: arrayUnion({
          senderId: currentUser?.id,
          text: text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser?.id, user?.id];
      userIDs.forEach(async (uid) => {
        if (!uid) return;
        const userChatsRef = doc(db, "userChats", uid);
        const userChatsSnap = await getDoc(userChatsRef);
        if (userChatsSnap.exists()) {
          const chats = userChatsSnap.data().chats;
          const chatIndex = chats.findIndex((c: any) => c.chatId === chatIdStr);
          if (chatIndex !== -1) {
            chats[chatIndex].lastMessage = text || "Sent an image";
            chats[chatIndex].isSeen = uid === currentUser?.id;
            chats[chatIndex].updatedAt = Date.now();
            await updateDoc(userChatsRef, { chats });
          }
        }
      });
      setWriteText("");
    } catch (err) {
      console.log(err);
      Alert.alert(
        "Message Not Sent",
        "We couldn't send your message. Check your internet connection and try again.",
      );
    }
  };

  const handleOpenProfile = () => {
    if (!user?.id || !id) return;

    router.push({
      pathname: "/profile/[userId]",
      params: {
        userId: user.id,
        chatId: id as string,
      },
    });
  };

  const handleToggleEmojiPicker = () => {
    if (emojiVisible) {
      setEmojiVisible(false);
      return;
    }

    Keyboard.dismiss();
    setEmojiVisible(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    setWriteText((prev) => `${prev}${emoji}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#1a1a1a" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={handleOpenProfile}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: user?.avatar || "https://via.placeholder.com/50" }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerName}>{user?.username || "User"}</Text>
            <Text style={styles.headerStatus}>Tap to view profile</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDetailsVisible(true)}>
          <MaterialIcons name="more-vert" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={chat?.messages || []}
          keyExtractor={(item, index) => index.toString()}
          onContentSizeChange={() => {
            if (chat?.messages?.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          renderItem={({ item }) => {
            const isMine = item.senderId === currentUser?.id;
            const relativeTime = getRelativeMessageTime(item.createdAt);
            return (
              <View
                style={[
                  styles.msgWrapper,
                  isMine ? styles.myMsgWrapper : styles.theirMsgWrapper,
                ]}
              >
                <View
                  style={[
                    styles.msgBubble,
                    isMine ? styles.myBubble : styles.theirBubble,
                  ]}
                >
                  {item.img && (
                    <Image source={{ uri: item.img }} style={styles.msgImg} />
                  )}
                  {item.text ? (
                    <Text
                      style={[
                        styles.msgText,
                        isMine ? styles.myText : styles.theirText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  ) : null}
                  {relativeTime ? (
                    <Text
                      style={[
                        styles.msgTime,
                        isMine ? styles.myTime : styles.theirTime,
                      ]}
                    >
                      {relativeTime}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />

        {/* Input Area */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={pickImage}>
            <Ionicons name="image" size={28} color="#53acfb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleEmojiPicker}>
            <Ionicons
              name={emojiVisible ? "happy" : "happy-outline"}
              size={28}
              color="#facc15"
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={
              isCurrentUserBlocked || isReceiverBlocked ? "Blocked" : "Type..."
            }
            value={writeText}
            onChangeText={setWriteText}
            editable={!isCurrentUserBlocked && !isReceiverBlocked}
            onFocus={() => setEmojiVisible(false)}
          />
          <TouchableOpacity
            onPress={() => sendMessage(null, writeText)}
            disabled={loading || !writeText.trim()}
          >
            <Ionicons
              name="send"
              size={28}
              color={writeText.trim() ? "#53acfb" : "#ccc"}
            />
          </TouchableOpacity>
        </View>

        {emojiVisible ? (
          <View style={styles.emojiPanel}>
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Emojis</Text>
              <Pressable onPress={() => setEmojiVisible(false)}>
                <Ionicons name="close" size={22} color="#9ca3af" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiGroups}
            >
              {EMOJI_GROUPS.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.emojiGroup}>
                  {group.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.emojiButton}
                      onPress={() => handleEmojiSelect(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ChatDetails
        chatId={id as string}
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212", // Dark background like your web app
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1a1a1a", // Dark Navbar
    borderBottomWidth: 1,
    borderBottomColor: "#595858",
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: "#53acfb",
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff", // White text
  },
  headerStatus: {
    fontSize: 12,
    color: "#53acfb", // Blue highlight
  },
  msgWrapper: {
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  myMsgWrapper: {
    alignItems: "flex-end",
  },
  theirMsgWrapper: {
    alignItems: "flex-start",
  },
  msgBubble: {
    maxWidth: "80%",
  },
  myBubble: {
    backgroundColor: "#102314",
    padding: 12,
    borderRadius: 15,
    borderBottomRightRadius: 2,
  },
  theirBubble: {
    backgroundColor: "#333", // Dark bubbles for others
    padding: 12,
    borderRadius: 15,
    borderBottomLeftRadius: 2,
  },
  msgImg: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 8,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 11,
    marginTop: 6,
  },
  myText: { color: "#fff" },
  theirText: { color: "#fff" },
  myTime: { color: "rgba(255,255,255,0.75)", textAlign: "right" },
  theirTime: { color: "#b3b3b3" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#464646",
    borderTopWidth: 1,
    borderTopColor: "#969494",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#5a5a5a",
    borderRadius: 25,
    paddingHorizontal: 15,
    color: "#fff",
    height: 45,
  },
  emojiPanel: {
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "#2b3548",
    paddingTop: 12,
    paddingBottom: 18,
  },
  emojiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  emojiTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  emojiGroups: {
    paddingHorizontal: 10,
    gap: 12,
  },
  emojiGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 224,
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 24,
  },
});
