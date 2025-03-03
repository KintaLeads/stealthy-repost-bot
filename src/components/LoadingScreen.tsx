
import React from "react";

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-medium mb-2">Loading...</h2>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
