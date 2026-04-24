import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import ChatDetails from "../../components/ChatDetails";

export default function ChatDetailsScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();

  return (
    <ChatDetails
      chatId={chatId ?? ""}
      visible
      onClose={() => router.back()}
    />
  );
}
