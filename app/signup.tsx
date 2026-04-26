import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authentication, db } from "../firebaseConfig";

// TSX: Defining the structure of our image state
interface UploadImage {
  uri: string | null;
  base64?: string;
}

const SignUp = () => {
  const router = useRouter();
  const [signUpDetails, setSignUpDetails] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [image, setImage] = useState<UploadImage>({ uri: null });
  const [loading, setLoading] = useState(false);

  // Mobile Lesson: Accessing the Gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage({ uri: result.assets[0].uri });
    }
  };

  const uploadToCloudinary = async () => {
    if (!image.uri) return "";

    const data = new FormData();
    // TSX/Native Trick: We need to format the file differently for mobile
    const fileToUpload = {
      uri: image.uri,
      type: `image/${image.uri.split(".").pop()}`,
      name: `upload.${image.uri.split(".").pop()}`,
    };

    // @ts-ignore: FormData in React Native is slightly different than Web
    data.append("file", fileToUpload);
    data.append("upload_preset", "ReactChatAppUploads");
    data.append("cloud_name", "dmrgvxawa");

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dmrgvxawa/image/upload",
        data,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleSignUpSubmit = async () => {
    if (
      !signUpDetails.email ||
      !signUpDetails.password ||
      !signUpDetails.name
    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const accountCreated = await createUserWithEmailAndPassword(
        authentication,
        signUpDetails.email,
        signUpDetails.password,
      );
      const uid = accountCreated.user.uid;

      // 2. Upload Image if exists
      let avatarUrl = "";
      if (image.uri) {
        avatarUrl = await uploadToCloudinary();
      }

      // 3. Save to Firestore
      await setDoc(doc(db, "users", uid), {
        username: signUpDetails.name,
        email: signUpDetails.email,
        id: uid,
        timeStamp: Date.now(),
        avatar: avatarUrl,
        blocked: [],
      });

      await setDoc(doc(db, "userChats", uid), { chats: [] });

      // 4. Log out and Redirect
      await signOut(authentication);
      Alert.alert("Success", "Account created! Please login.");
      router.replace("/login"); // Mobile version of navigate()
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            <Image
              source={
                image.uri
                  ? { uri: image.uri }
                  : require("../assets/images/userIcon.webp")
              }
              style={styles.avatar}
            />
            <Text style={styles.uploadText}>Upload Image</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Display Name"
            onChangeText={(text) =>
              setSignUpDetails({ ...signUpDetails, name: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(text) =>
              setSignUpDetails({ ...signUpDetails, email: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            onChangeText={(text) =>
              setSignUpDetails({ ...signUpDetails, password: text })
            }
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabled]}
            onPress={handleSignUpSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  imagePicker: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  uploadText: { marginTop: 10, color: "gray", textDecorationLine: "underline" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#53acfb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  disabled: { backgroundColor: "#ccc" },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  backText: { marginTop: 20, textAlign: "center", color: "#007bff" },
});
