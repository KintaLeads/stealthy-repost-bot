
import React from 'react';
import { Bell, Settings, Moon, Sun, LogOut, User, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode, userEmail, onSignOut }) => {
  const { toast } = useToast();
  
  const handleNotificationClick = () => {
    toast({
      title: "All caught up!",
      description: "You have no new notifications",
    });
  };

  const handleHelpClick = () => {
    toast({
      title: "Help & Support",
      description: "Documentation and support resources coming soon",
    });
  };

  return (
    <header className="w-full py-6 px-8 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {/* Telegram Logo SVG */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M16.586 8.306c0.129 0.109 0.169 0.211 0.18 0.294 0.01 0.083-0.017 0.168-0.083 0.254-0.077 0.099-0.255 0.319-0.492 0.611-0.256 0.316-0.604 0.745-1.03 1.272-0.76 0.938-1.746 2.144-2.457 3.015-0.124 0.152-0.318 0.267-0.523 0.297-0.206 0.031-0.389-0.025-0.514-0.128-0.298-0.247-0.854-0.708-1.347-1.116-0.256-0.212-0.499-0.413-0.705-0.584-0.099-0.082-0.188-0.156-0.263-0.218L9.3 11.968c-0.321-0.262-0.557-0.454-0.653-0.53-0.057-0.046-0.066-0.084-0.067-0.105 0-0.021 0.009-0.064 0.067-0.108 0.064-0.048 0.113-0.063 0.15-0.07 0.037-0.006 0.077-0.004 0.117 0.01 0.051 0.018 0.245 0.092 0.483 0.181L9.4 11.348c0.505 0.19 1.306 0.491 2.112 0.794 1.614 0.606 3.233 1.213 3.233 1.213s0.345-1.477 0.688-2.95c0.169-0.726 0.339-1.453 0.467-2.006 0.059-0.254 0.105-0.455 0.137-0.592l0.039-0.177c0.032-0.153 0.053-0.245 0.084-0.313 0.022-0.047 0.051-0.086 0.094-0.114 0.053-0.035 0.125-0.047 0.185-0.047 0.202 0 0.306 0.106 0.306 0.106l0.058 0.044z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-medium">Telegram Content Manager</h1>
          <p className="text-sm text-muted-foreground">Seamless channel management</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {userEmail && (
          <div className="mr-2 text-sm text-muted-foreground">
            <span>{userEmail}</span>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNotificationClick}
          className="relative hover:bg-secondary/80 transition-colors"
        >
          <Bell size={18} className="text-muted-foreground" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleDarkMode}
          className="hover:bg-secondary/80 transition-colors"
        >
          {isDarkMode ? (
            <Sun size={18} className="text-muted-foreground" />
          ) : (
            <Moon size={18} className="text-muted-foreground" />
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-secondary/80 transition-colors"
            >
              <Settings size={18} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => toast({ title: "Settings", description: "Application settings opened" })}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHelpClick}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Support</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/settings/dashboard"}>
              <User className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onSignOut && (
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {onSignOut && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onSignOut}
            className="hover:bg-secondary/80 transition-colors"
          >
            <LogOut size={18} className="text-muted-foreground" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
