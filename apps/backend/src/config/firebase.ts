import { initializeApp } from 'firebase-admin/app';

export const firebaseApp = () => initializeApp({
    projectId: "deploy-kit-c15f6",
});