
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const EmptyChannelState: React.FC = () => {
  return (
    <Card className="w-full glass-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-xl">Channel Configuration</CardTitle>
        <CardDescription>
          Select an API account to configure channels
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Please select or create an API account first
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyChannelState;
