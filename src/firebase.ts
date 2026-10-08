import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpR2SyQnfBxjXRmpmKQaqhzVCoy2gs2Cg",
  authDomain: "gen-lang-client-0530555722.firebaseapp.com",
  projectId: "gen-lang-client-0530555722",
  storageBucket: "gen-lang-client-0530555722.firebasestorage.app",
  messagingSenderId: "518497463646",
  appId: "1:518497463646:web:69dc16a1c7606b396833cf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
