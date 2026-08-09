# My Chat App

A cross-platform mobile chat application built with React Native and Expo. The project demonstrates an end-to-end messaging experience: account creation, profile setup, user discovery, real-time conversations, image sharing, and chat controls.

## Why this project

This app was built to apply production-minded mobile patterns to a social product: authentication-gated navigation, real-time UI updates, cloud-backed user data, local client state, and responsive interactions that work around mobile keyboards and safe areas.

## Highlights

- Email and password authentication with Firebase Authentication
- New-user onboarding with display name and optional avatar upload
- User search and one-to-one conversation creation
- Real-time message and conversation-list updates via Firestore listeners
- Text, emoji, and image messages; uploaded images are hosted with Cloudinary
- Seen/unseen conversation state and relative message timestamps
- Profile viewing, blocking/unblocking, and clearing conversations
- Mobile-focused UX including safe areas, keyboard avoidance, image picking, haptics, and adaptive navigation

## Tech stack

| Area             | Technologies                                          |
| ---------------- | ----------------------------------------------------- |
| Mobile app       | React Native, Expo, TypeScript                        |
| Navigation       | Expo Router                                           |
| Backend services | Firebase Authentication, Cloud Firestore              |
| Client state     | Zustand                                               |
| Media            | Expo Image Picker, Cloudinary                         |
| UI               | Expo Vector Icons, Expo Blur, React Native StyleSheet |
| Utilities        | Axios, date-fns                                       |

## Architecture at a glance

```text
app/             File-based screens and navigation
components/      Reusable chat, user, and UI components
store/           Zustand stores for the signed-in user and active chat
firebaseConfig.js Firebase initialization and service exports
assets/          Images and app branding assets
```

Firestore holds user profiles, chat documents, and each user's conversation index. Snapshot listeners keep the inbox and open conversation synchronized while Zustand provides lightweight shared state for the active user and chat.

## Run locally

### Prerequisites

- Node.js (LTS recommended)
- Expo Go on a physical device, or an Android/iOS emulator
- A Firebase project with Email/Password authentication and Cloud Firestore enabled

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file and add the public Firebase configuration values used by `firebaseConfig.js`:

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_value
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_value
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
   EXPO_PUBLIC_FIREBASE_APP_ID=your_value
   ```

3. Start Expo:

   ```bash
   npm start
   ```

4. Choose a target from the Expo terminal, or run one directly:

   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Quality checks

```bash
npm run lint
```

## Product opportunities

Potential next steps include moving Cloudinary configuration to environment variables, adding Firestore security rules and automated tests, supporting push notifications, and introducing pagination for large conversation histories.

## Author

Built by **Dinesh** as a React Native portfolio project.
