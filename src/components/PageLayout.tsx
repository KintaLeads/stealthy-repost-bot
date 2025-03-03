
import React from "react";
import Header from "./Header";

interface PageLayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  isDarkMode,
  toggleDarkMode,
  userEmail,
  onSignOut
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-8 text-center animate-fade-in">
            <h1 className="text-4xl font-medium tracking-tight mb-3">
              Telegram Channel Manager
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamline your channel content with our elegant, intuitive management solution
            </p>
          </div>
          
          {children}
        </div>
      </main>
      
      <footer className="py-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Telegram Content Manager
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;
