// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { auth, onAuthStateChanged, signInWithGoogle, signOut, type User } from "../lib/firebase";

export type AuthState = {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);

    async function handleSignIn() {
        try {
            setError(null);
            await signInWithGoogle();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sign in failed");
        }
    }

    async function handleSignOut() {
        try {
            await signOut();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Sign out failed");
        }
    }

    return { user, loading, error, signIn: handleSignIn, signOut: handleSignOut };
}