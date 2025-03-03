
import React from 'react';
import { Bell, Settings, Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const { toast } = useToast();
  
  const handleNotificationClick = () => {
    toast({
      title: "All caught up!",
      description: "You have no new notifications",
    });
  };

  return (
    <header className="w-full py-6 px-8 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path 
                d="M17.9 12.37C17.9 12.7 17.63 12.97 17.3 12.97H6.7C6.37 12.97 6.1 12.7 6.1 12.37V11.63C6.1 11.3 6.37 11.03 6.7 11.03H17.3C17.63 11.03 17.9 11.3 17.9 11.63V12.37Z" 
                fill="currentColor"
              />
              <path 
                d="M12.9 17.3C12.9 17.63 12.63 17.9 12.3 17.9H11.7C11.37 17.9 11.1 17.63 11.1 17.3V6.7C11.1 6.37 11.37 6.1 11.7 6.1H12.3C12.63 6.1 12.9 6.37 12.9 6.7V17.3Z" 
                fill="currentColor"
              />
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" 
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-medium">Telegram Content Manager</h1>
          <p className="text-sm text-muted-foreground">Seamless channel management</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
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
        
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-secondary/80 transition-colors"
        >
          <Settings size={18} className="text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
