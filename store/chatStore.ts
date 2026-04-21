import { create } from "zustand";
import { useUserStore } from "./userStore";

// 1. Define the Interface for the user we are chatting with
interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  blocked: string[]; // Array of UIDs
  [key: string]: any;
}

// 2. Define the Store State and Actions
interface ChatState {
  chatId: string | null;
  user: ChatUser | null;
  isCurrentUserBlocked: boolean;
  isReceiverBlocked: boolean;
  changeChat: (chatId: string, user: ChatUser) => void;
  changeBlock: () => void;
  resetChat: () => void; // Added for safety (e.g., when logging out)
}

export const useChatStore = create<ChatState>((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // Safety check: if for some reason currentUser isn't loaded
    if (!currentUser) return;

    // 3. Check if current user is blocked by the receiver
    if (user.blocked?.includes(currentUser.id)) {
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    }
    // 4. Check if receiver is blocked by the current user
    else if (currentUser.blocked?.includes(user.id)) {
      return set({
        chatId,
        user: user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    } else {
      // 5. Normal chat state
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  changeBlock: () => {
    set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
  },

  resetChat: () => {
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));
