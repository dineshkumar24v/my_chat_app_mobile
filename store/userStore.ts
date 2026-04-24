import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../firebaseConfig"; // Updated path to your mobile config

// 1. Define the User Interface
// This tells TypeScript exactly what fields a user has.
interface UserData {
  id: string;
  username: string;
  email: string;
  avatar?: string; // The '?' means this is optional
  [key: string]: any; // This allows for other fields you might have in Firestore
}

// 2. Define the Store State Interface
interface UserState {
  currentUser: UserData | null;
  isLoading: boolean;
  setCurrentUser: (user: UserData | null) => void;
  fetchUserInfo: (uid: string | null | undefined) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  isLoading: true,

  setCurrentUser: (user) => set({ currentUser: user, isLoading: false }),

  fetchUserInfo: async (uid) => {
    // 3. Truthy check: If no uid, reset store
    if (!uid) {
      return set({ currentUser: null, isLoading: false });
    }

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UserData>;
        set({
          currentUser: {
            id: uid,
            username: data.username ?? "",
            email: data.email ?? "",
            ...data,
          },
          isLoading: false,
        });
        console.log("User data loaded:", data);
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      set({ currentUser: null, isLoading: false });
    }
  },
}));
