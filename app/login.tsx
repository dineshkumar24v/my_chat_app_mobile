import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authentication } from "../firebaseConfig";

const Login = () => {
  const [loginDetails, setLoginDetails] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // In Native, we type the ref as <TextInput>
  const emailInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 500);
    }
  }, []);

  const handleLoginSubmit = async () => {
    if (!loginDetails.email || !loginDetails.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(
        authentication,
        loginDetails.email,
        loginDetails.password,
      );
      Alert.alert("Success", "Logged in as " + res.user.email);
      // Success is handled by _layout.tsx (it will see the user and switch screens)
    } catch (err: any) {
      console.log(err);
      // Native equivalent of Toast/Alert
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      {/* KeyboardAvoidingView prevents the keyboard from covering the inputs */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.loginContainer}
      >
        <View style={styles.innerContainer}>
          <Text style={styles.loginh1}>Login</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="email"
              keyboardType="email-address"
              autoCapitalize="none"
              ref={emailInputRef}
              onChangeText={(text) =>
                setLoginDetails({ ...loginDetails, email: text })
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="password"
              secureTextEntry={true} // Hides password characters
              onChangeText={(text) =>
                setLoginDetails({ ...loginDetails, password: text })
              }
            />
          </View>

          <TouchableOpacity
            style={[styles.loginSubmitBtn, loading && styles.disabledBtn]}
            onPress={handleLoginSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <Link href="/signup" style={styles.registerLink}>
            <Text style={{ color: "#007bff" }}>
              Dont have an account? Register
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

// CSS converted to StyleSheet
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loginContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  loginh1: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  loginSubmitBtn: {
    backgroundColor: "#53acfb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  disabledBtn: {
    backgroundColor: "#67a9e280",
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  registerLink: {
    marginTop: 20,
    textAlign: "center",
  },
});
