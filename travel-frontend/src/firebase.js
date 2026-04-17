import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADhd3JlMq6g0zNoO94pMerGoGGYkYhG1Q",
  authDomain: "velora-680d1.firebaseapp.com",
  projectId: "velora-680d1",
  storageBucket: "velora-680d1.firebasestorage.app",
  messagingSenderId: "845212926933",
  appId: "1:845212926933:web:a5f54babcc85141912f35c",
  measurementId: "G-4YT771XLKB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

export default app;
