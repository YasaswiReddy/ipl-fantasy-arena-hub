
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "@/types";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

interface AuthContextProps {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const initialAuthState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthState({
          token: session.access_token,
          user: {
            id: parseInt(session.user.id),
            email: session.user.email || '',
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          ...initialAuthState,
          isLoading: false,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuthState({
          token: session.access_token,
          user: {
            id: parseInt(session.user.id),
            email: session.user.email || '',
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuthState({
          ...initialAuthState,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated and trying to access protected route
    if (!authState.isLoading && !authState.isAuthenticated) {
      const isProtectedRoute = 
        !location.pathname.startsWith('/login') && 
        location.pathname !== '/';

      if (isProtectedRoute) {
        toast.error("Please log in to continue");
        navigate('/login', { replace: true });
      }
    }
  }, [authState.isAuthenticated, authState.isLoading, location.pathname, navigate]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Login successful");
        navigate("/home");
      }
    } catch (error) {
      toast.error("Login failed: " + (error as Error).message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("You have been logged out");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
