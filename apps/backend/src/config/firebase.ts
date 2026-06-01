import { initializeApp } from 'firebase-admin/app';
import { env } from ".";

export const firebaseApp = initializeApp({
    projectId: env.FIREBASE_PROJECT_ID,
});