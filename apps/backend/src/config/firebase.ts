import * as admin from "firebase-admin";
import { env } from ".";

export const firebaseApp = admin.initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
});