import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getPrototypeUser, PROTOTYPE_AUTH_EVENT, type PrototypeUser } from "@/lib/prototype-auth";
import { AuthScreen } from "./AuthScreen";

const AuthContext = createContext<PrototypeUser | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PrototypeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try { setUser(getPrototypeUser()); setFailed(false); }
      catch { setUser(null); setFailed(true); }
      setLoading(false);
    };
    refresh();
    window.addEventListener(PROTOTYPE_AUTH_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROTOTYPE_AUTH_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-primary" role="status">Abrindo a biblioteca…</div>;
  if (!user) return <AuthScreen sessionError={failed} />;
  return <AuthContext.Provider key={user.id} value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);
  if (!user) throw new Error("A sessão é necessária para acessar a biblioteca.");
  return user;
}
