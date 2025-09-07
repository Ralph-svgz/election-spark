import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { Vote, Settings, Users, Home, LogOut } from "lucide-react";

export const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Don't render navigation on auth page
  if (location.pathname === "/auth") {
    return null;
  }

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary">
            <Vote className="h-6 w-6" />
            <span>VoteSecure</span>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </Button>
              
              <Button 
                variant={isActive("/elections") ? "default" : "ghost"} 
                size="sm" 
                asChild
              >
                <Link to="/elections" className="flex items-center space-x-2">
                  <Vote className="h-4 w-4" />
                  <span>Elections</span>
                </Link>
              </Button>

              {isAdmin() && (
                <>
                  <Button 
                    variant={isActive("/admin") ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <Link to="/admin" className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </Button>
                  
                  <Button 
                    variant={isActive("/users") ? "default" : "ghost"} 
                    size="sm" 
                    asChild
                  >
                    <Link to="/users" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Users</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <ModeToggle />
          
          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};