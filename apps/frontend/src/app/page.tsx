"use client";
import Image from "next/image";
import { signInWithPopup } from "firebase/auth";
import {auth,provider} from "@/config/firebase"
import axiosClient from "@/config/axiosClient";

export default function Home() {
  const signInWithGoogle = async () => {
      const creds = await signInWithPopup(auth, provider)
      const user = creds.user
      const idToken = await user.getIdToken()
      console.log("User:", user, "Token:", idToken)
      const response = await axiosClient.post("/auth/login", {idToken})
      console.log("Sign in response:", response.data)
  }
  
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <button onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
}
