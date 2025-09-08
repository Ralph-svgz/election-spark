import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Vote, Settings, Users, Home, LogOut, Menu } from "lucide-react";
import { useState } from "react";

export const Navigation = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Don't render navigation on auth page
  if (location.pathname === "/auth") {
    return null;
  }

  const NavigationItems = () => (
    <>
      <Button 
        variant={isActive("/") ? "default" : "ghost"} 
        size="sm" 
        asChild
        onClick={() => setIsOpen(false)}
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
        onClick={() => setIsOpen(false)}
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
            onClick={() => setIsOpen(false)}
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
            onClick={() => setIsOpen(false)}
          >
            <Link to="/users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary">
            <Vote className="h-6 w-6" />
            <span className="hidden sm:inline">VoteSecure</span>
          </Link>
          
          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <NavigationItems />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <ModeToggle />
          
          {/* Mobile Menu Button */}
          {user && (
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <Vote className="h-6 w-6 text-primary" />
                      <span className="text-xl font-bold text-primary">VoteSecure</span>
                    </div>
                    <NavigationItems />
                    <div className="pt-4 mt-4 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                        className="flex items-center space-x-2 w-full justify-start"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
          
          {/* Desktop Sign Out */}
          {user && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="hidden md:flex items-center space-x-2"
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