// src/lib/firebase.ts
// Firebase client — configure via frontend/.env.local
// Required env vars (no VITE_ prefix — use secrets instead):
//   FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID,
//   FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID

import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as fbSignOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    type DocumentData,
    type QueryConstraint,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// ── Config ─────────────────────────────────────────────────────────────────────
// In production these come from buildfast Cloud secrets (never VITE_* env vars)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "demo-api-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "demo-project.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "demo-project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "demo-project.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "000000000000",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:000000000000:web:000000000000",
};

// ── App (singleton) ────────────────────────────────────────────────────────────
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ── Services ───────────────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ── Auth helpers ───────────────────────────────────────────────────────────────
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    // Upsert user profile in Firestore
    await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        updatedAt: serverTimestamp(),
    }, { merge: true });
    return result.user;
}

export async function signOut(): Promise<void> {
    await fbSignOut(auth);
}

export { onAuthStateChanged };
export type { User };

// ── Firestore helpers ──────────────────────────────────────────────────────────
// All queries MUST be scoped to the authenticated user's uid.
// Data model: users/{uid}/projects/{projectId}/messages/{messageId}

export type Project = {
    id: string;
    uid: string;
    name: string;
    files: Record<string, string>;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
};

export type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Timestamp | null;
};

// ── Projects ───────────────────────────────────────────────────────────────────

export function projectsRef(uid: string) {
    return collection(db, "users", uid, "projects");
}

export async function createProject(uid: string, name: string): Promise<string> {
    const ref = await addDoc(projectsRef(uid), {
        uid, name, files: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
    const snap = await getDoc(doc(db, "users", uid, "projects", projectId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Project;
}

export async function updateProjectFiles(uid: string, projectId: string, files: Record<string, string>) {
    await updateDoc(doc(db, "users", uid, "projects", projectId), {
        files,
        updatedAt: serverTimestamp(),
    });
}

export function subscribeToProjects(uid: string, cb: (projects: Project[]) => void) {
    const q = query(projectsRef(uid), where("uid", "==", uid), orderBy("updatedAt", "desc"));
    return onSnapshot(q, snap => {
        cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    });
}

export async function deleteProject(uid: string, projectId: string) {
    await deleteDoc(doc(db, "users", uid, "projects", projectId));
}

// ── Messages ───────────────────────────────────────────────────────────────────

export function messagesRef(uid: string, projectId: string) {
    return collection(db, "users", uid, "projects", projectId, "messages");
}

export async function addMessage(uid: string, projectId: string, role: "user" | "assistant", content: string) {
    return addDoc(messagesRef(uid, projectId), {
        role, content, createdAt: serverTimestamp(),
    });
}

export function subscribeToMessages(
    uid: string,
    projectId: string,
    cb: (messages: Message[]) => void
) {
    const q = query(messagesRef(uid, projectId), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => {
        cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
}

// ── Storage helpers ────────────────────────────────────────────────────────────

export async function uploadFile(uid: string, projectId: string, filename: string, file: File): Promise<string> {
    const fileRef = ref(storage, `projects/${uid}/${projectId}/${filename}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
}

export async function deleteFile(uid: string, projectId: string, filename: string) {
    const fileRef = ref(storage, `projects/${uid}/${projectId}/${filename}`);
    await deleteObject(fileRef);
}

// Re-export Firestore utilities for use in components
export {
    collection, doc, addDoc, setDoc, getDoc, getDocs,
    updateDoc, deleteDoc, query, where, orderBy, limit,
    onSnapshot, serverTimestamp, Timestamp,
    ref, uploadBytes, getDownloadURL,
};
export type { DocumentData, QueryConstraint };