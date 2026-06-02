// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiL50QWaegUezsi8fyWRsDuXO0qO-wKZw",
  authDomain: "deploy-kit-c15f6.firebaseapp.com",
  projectId: "deploy-kit-c15f6",
  storageBucket: "deploy-kit-c15f6.firebasestorage.app",
  messagingSenderId: "745427371223",
  appId: "1:745427371223:web:cfaccca7340a0a60c51c92",
  measurementId: "G-R9T3TRZRZG"
};

const app = initializeApp(firebaseConfig);

export const provider = new GoogleAuthProvider();
export const auth = getAuth();


// Initialize Firebase