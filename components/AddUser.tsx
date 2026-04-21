import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebaseConfig";
import { useUserStore } from "../store/userStore";

const AddUser = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const { currentUser } = useUserStore();

  const handleSearch = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username),
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        setUser(querySnap.docs[0].data());
      } else {
        Alert.alert("Not Found", "User does not exist.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    if (!user || !currentUser) return;
    try {
      const newChatRef = doc(collection(db, "chats"));
      await setDoc(newChatRef, { createdAt: serverTimestamp(), messages: [] });

      const chatEntry = (receiverId: string) => ({
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId,
        updatedAt: Date.now(),
      });

      await updateDoc(doc(db, "userChats", user.id), {
        chats: arrayUnion(chatEntry(currentUser.id)),
      });
      await updateDoc(doc(db, "userChats", currentUser.id), {
        chats: arrayUnion(chatEntry(user.id)),
      });

      onClose();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add User</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              onChangeText={setUsername}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={{ color: "white" }}>Search</Text>
            </TouchableOpacity>
          </View>

          {user && (
            <View style={styles.userResult}>
              <View style={styles.userInfo}>
                <Image
                  source={{
                    uri: user.avatar || "https://via.placeholder.com/150",
                  }}
                  style={styles.avatar}
                />
                <Text>{user.username}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={{ color: "white" }}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
            <Text style={{ color: "red", textAlign: "center" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "white", borderRadius: 20, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchBtn: { backgroundColor: "#007bff", padding: 12, borderRadius: 8 },
  userResult: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  addBtn: { backgroundColor: "#28a745", padding: 10, borderRadius: 8 },
});

export default AddUser;
