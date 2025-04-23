
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Header = () => {
  const { authState, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-ipl-gradient text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-6">IPL Fantasy Hub</h1>
        </div>

        {authState.isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="flex items-center mr-2">
              <span className="text-sm font-medium">{authState.user?.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
