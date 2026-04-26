import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import UserInfo from "../../components/UserInfo"; // We will create these next
import UserList from "../../components/UserList";

export default function HomeIndex() {
  return (
    // SafeAreaView ensures content doesn't go under the "Notch" or camera hole
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.listCont}>
        <UserInfo />
        <UserList />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
    // On Android, we need to add padding for the status bar
    paddingTop: StatusBar.currentHeight,
  },
  listCont: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
});
