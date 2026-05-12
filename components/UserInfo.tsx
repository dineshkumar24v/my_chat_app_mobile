import { Ionicons } from "@expo/vector-icons"; // Mobile equivalent of react-icons
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 15 });
  const menuButtonRef = useRef<View>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      return () => setDropdownOpen(false);
    }, [])
  );

  const toggleDropdown = () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }

    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({
        top: y + height + 6,
        right: Dimensions.get("window").width - x - width,
      });
      setDropdownOpen(true);
    });
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
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
        onPress={() => {
          setDropdownOpen(false);
          router.navigate("/explore");
        }}
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
        <TouchableOpacity ref={menuButtonRef} onPress={toggleDropdown}>
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={dropdownOpen}
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setDropdownOpen(false)}
        >
          <Pressable
            style={[
              styles.dropdown,
              { top: menuPosition.top, right: menuPosition.right },
            ]}
          >
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    backgroundColor: "transparent",
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "transparent",
    borderColor: "#667282",
    borderWidth: 1,
    borderRadius: 18,
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
    padding: 8,
    borderRadius: 15,
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});
