import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  language?: string;
  specialization?: string;
  profilePictureUrl?: string | null;
}

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  loginWithFirebase: (
    idToken: string,
    role: string,
    additionalData?: any
  ) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  specialization?: string;
  age?: number;
  gender?: string;
}

const AuthContext = createContext<AuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Check current auth status
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: async () => {
      // If we have a Firebase user but no session, redirect to login
      if (firebaseUser && !document.cookie.includes("sessionId")) {
        // Check if we're already on login page to avoid infinite redirect
        if (!window.location.pathname.startsWith("/login")) {
          return null;
        }
      }

      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      return await res.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      role,
    }: {
      email: string;
      password: string;
      role: string;
    }) => {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
        role,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      
      // Redirect based on user role
      if (data.user.role === "doctor") {
        setLocation("/doctor-dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
  });

  const firebaseLoginMutation = useMutation({
    mutationFn: async ({
      idToken,
      role,
      additionalData,
    }: {
      idToken: string;
      role: string;
      additionalData?: any;
    }) => {
      const payload = { idToken, role, ...additionalData };
      const response = await apiRequest(
        "POST",
        "/api/auth/firebase-login",
        payload
      );
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      
      // Redirect based on user role
      if (data.user.role === "doctor") {
        setLocation("/doctor-dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
      
      // Redirect based on user role
      if (data.user.role === "doctor") {
        setLocation("/doctor-dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      
      // Also sign out from Firebase if available
      if (auth) {
        try {
          await auth.signOut();
        } catch (error) {
          console.error("Error signing out from Firebase:", error);
        }
      }
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  const login = async (email: string, password: string, role: string) => {
    await loginMutation.mutateAsync({ email, password, role });
  };

  const loginWithFirebase = async (
    idToken: string,
    role: string,
    additionalData?: any
  ) => {
    await firebaseLoginMutation.mutateAsync({ idToken, role, additionalData });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Redirect to appropriate dashboard based on user role
  useEffect(() => {
    if (!isLoading && user) {
      // Check current path and redirect if needed
      const currentPath = window.location.pathname;
      
      if (user.role === "doctor") {
        // Doctors should be on doctor dashboard
        if (currentPath === "/dashboard") {
          setLocation("/doctor-dashboard");
        } else if (currentPath === "/" || currentPath === "/login") {
          setLocation("/doctor-dashboard");
        }
      } else {
        // Patients should be on patient dashboard
        if (currentPath === "/doctor-dashboard") {
          setLocation("/dashboard");
        } else if (currentPath === "/" || currentPath === "/login") {
          setLocation("/dashboard");
        }
      }
    } else if (!isLoading && !user) {
      // Not authenticated, redirect to login (except for login/register pages)
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        setLocation("/login");
      }
    }
  }, [user, isLoading, setLocation]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        loginWithFirebase,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}