import { Ionicons } from "@expo/vector-icons"; // Mobile equivalent of react-icons
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authentication } from "../firebaseConfig";
import { useUserStore } from "../store/userStore";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authentication.signOut();
            useUserStore.getState().setCurrentUser(null);
            console.log("User signed out");
          } catch (error) {
            console.error("Error signing out:", error);
          }
        },
      },
    ]);
  };

  if (!currentUser) return null;

  return (
    <View style={styles.userInfoCont}>
      <TouchableOpacity
        style={styles.user}
        onPress={() => router.navigate("/explore")}
        activeOpacity={0.7}
        hitSlop={8}
      >
        <Image
          source={
            currentUser.avatar
              ? { uri: currentUser.avatar }
              : require("../assets/images/chat.png")
          }
          style={styles.avatar}
        />
        <Text style={styles.username}>{currentUser.username}</Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </TouchableOpacity>

      <View style={styles.icons}>
        <TouchableOpacity onPress={() => setDropdownOpen(!dropdownOpen)}>
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default UserInfo;

const styles = StyleSheet.create({
  userInfoCont: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 10, // Ensures dropdown stays on top
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    height: 45,
    width: 45,
    borderRadius: 22.5,
    backgroundColor: "#ccc",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: 30,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 5,
    elevation: 5, // Android Shadow
    shadowColor: "#000", // iOS Shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 100,
    zIndex: 100,
  },
  logoutBtn: {
    backgroundColor: "#c30128",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});
