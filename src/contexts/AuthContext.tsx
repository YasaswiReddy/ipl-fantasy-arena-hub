import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "@/types";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextProps {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean; // New property to check admin status
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
  
  // Determine if user is admin (in this case, we're simply checking if user id is 1)
  const isAdmin = authState.user?.id === 1;

  useEffect(() => {
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
    if (!authState.isLoading && !authState.isAuthenticated) {
      const isProtectedRoute = 
        !location.pathname.startsWith('/login') && 
        location.pathname !== '/';

      if (isProtectedRoute) {
        toast.error("Please log in to continue");
        navigate('/login', { replace: true });
      }
    }
    
    // Redirect from admin page if not admin
    if (!authState.isLoading && authState.isAuthenticated && 
        location.pathname === '/admin' && !isAdmin) {
      toast.error("You don't have permission to access the admin page");
      navigate('/home', { replace: true });
    }
  }, [authState.isAuthenticated, authState.isLoading, location.pathname, navigate, isAdmin]);

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
    <AuthContext.Provider value={{ authState, login, logout, isAdmin }}>
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