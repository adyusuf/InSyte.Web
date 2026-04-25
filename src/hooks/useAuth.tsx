import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api, { tokenStorage } from "../lib/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (token) {
      api
        .get("/v1/auth/me")
        .then((res) => setUser(res.data.data))
        .catch(() => tokenStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/v1/auth/login", { email, password });
    const { accessToken, refreshToken, user: loggedInUser } = res.data.data;
    tokenStorage.setAccess(accessToken);
    tokenStorage.setRefresh(refreshToken);
    setUser(loggedInUser);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
