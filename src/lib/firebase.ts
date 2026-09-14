import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDi1pG3asj6WKJ5Ioya1kyn-IrQLWU0ppY",
  authDomain: "velavan-scheduler.firebaseapp.com",
  projectId: "velavan-scheduler",
  storageBucket: "velavan-scheduler.firebasestorage.app",
  messagingSenderId: "272458427387",
  appId: "1:272458427387:web:e36979466b7e5fc9cd395e"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
