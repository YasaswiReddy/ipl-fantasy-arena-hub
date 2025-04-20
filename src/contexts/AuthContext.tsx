
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "@/types";
import { api } from "@/services/api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

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
    // Initialize auth state from localStorage
    const token = localStorage.getItem("auth_token");
    const userJson = localStorage.getItem("user");
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        setAuthState({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to parse user data", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setAuthState({
          ...initialAuthState,
          isLoading: false,
        });
      }
    } else {
      setAuthState({
        ...initialAuthState,
        isLoading: false,
      });
    }
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
      const response = await api.login(email, password);
      
      if (response && response.token) {
        // Mock user data - in a real app, this would come from the API
        const mockUser: User = {
          id: 1,
          email,
          name: email.split('@')[0],
        };
        
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user", JSON.stringify(mockUser));
        
        setAuthState({
          token: response.token,
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        });
        
        toast.success("Login successful");
        navigate("/home");
      }
    } catch (error) {
      toast.error("Login failed: " + (error as Error).message);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
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
