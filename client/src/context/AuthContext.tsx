import { createContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LOCAL_STORAGE } from "../utils/constants";

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
  google_id: string;
  is_admin: boolean;
  shlok_count: number;
  last_shlok_advanced: string | null;
  phone: string;
  is_phone_verified: boolean;
  is_wa_subscribed: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE.TOKEN);
    const storedUser = localStorage.getItem(LOCAL_STORAGE.USER);

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        console.error("Failed to parse stored user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(LOCAL_STORAGE.TOKEN, newToken);
    localStorage.setItem(LOCAL_STORAGE.USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    navigate("/home");
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE.USER);
    setToken(null);
    setUser(null);
    navigate("/");
  };

  // updateUser merges partial user updates into local state + storage
  const updateUser = (partial: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    localStorage.setItem(LOCAL_STORAGE.USER, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
