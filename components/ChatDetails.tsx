import { arrayRemove, arrayUnion, doc, updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";
import { useChatStore } from "../store/chatStore";
import { useUserStore } from "../store/userStore";

type ChatDetailsProps = {
  chatId: string;
  visible: boolean;
  onClose: () => void;
};

export default function ChatDetails({
  chatId,
  visible,
  onClose,
}: ChatDetailsProps) {
  const { user, isReceiverBlocked, changeBlock } = useChatStore();
  const { currentUser, setCurrentUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!currentUser || !user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    setLoading(true);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });

      const nextBlocked = isReceiverBlocked
        ? (currentUser.blocked || []).filter(
            (blockedId: string) => blockedId !== user.id,
          )
        : [...(currentUser.blocked || []), user.id];

      setCurrentUser({ ...currentUser, blocked: nextBlocked });
      changeBlock();
      Alert.alert(
        "Success",
        isReceiverBlocked ? "User Unblocked" : "User Blocked",
      );
      onClose();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not update block status.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (!chatId) return;

    Alert.alert("Clear Chat", "Delete all messages in this conversation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await updateDoc(doc(db, "chats", chatId), { messages: [] });
            Alert.alert("Success", "Chat cleared.");
            onClose();
          } catch (err) {
            console.log(err);
            Alert.alert("Error", "Could not clear chat.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.userCard}>
            <Image
              source={
                user?.avatar
                  ? { uri: user.avatar }
                  : require("../assets/images/favicon1.png")
              }
              style={styles.avatar}
            />
            <Text style={styles.username}>
              {user?.username || "Unknown User"}
            </Text>
            <Text style={styles.subtitle}>
              {isReceiverBlocked
                ? "You have blocked this user."
                : "Manage chat actions here."}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.blockButton,
              loading && styles.disabled,
            ]}
            onPress={handleBlock}
            disabled={loading || !currentUser || !user}
          >
            <Text style={styles.actionText}>
              {isReceiverBlocked ? "Unblock User" : "Block User"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.clearButton,
              loading && styles.disabled,
            ]}
            onPress={handleClearChat}
            disabled={loading || !chatId}
          >
            <Text style={styles.actionText}>Clear Chat</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  handle: {
    alignSelf: "center",
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#444",
    marginBottom: 8,
  },
  userCard: {
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#2a2a2a",
  },
  username: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  blockButton: {
    backgroundColor: "#2563eb",
  },
  clearButton: {
    backgroundColor: "#b91c1c",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});
