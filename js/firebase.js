// Aim-IB Firebase setup (CDN / no bundler)
// This file exports `auth`, `db`, and a Google provider.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtt1Xi0AvPnQ_hcIZ_119bAvBU6x1ekw0",
  authDomain: "aim-ib.firebaseapp.com",
  projectId: "aim-ib",
  storageBucket: "aim-ib.firebasestorage.app",
  messagingSenderId: "253115986912",
  appId: "1:253115986912:web:bbf4036a4f6a075337b185",
  measurementId: "G-MTL3E6C9JH",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: force account chooser each time (nice for testing)
// googleProvider.setCustomParameters({ prompt: "select_account" });
