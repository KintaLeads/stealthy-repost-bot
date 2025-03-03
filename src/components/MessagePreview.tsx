
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  text: string;
  media?: string;
  time: string;
  username: string;
  processed: boolean;
}

interface MessagePreviewProps {
  messages: Message[];
  isLoading: boolean;
}

const MessagePreview: React.FC<MessagePreviewProps> = ({ messages, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full glass-card h-[400px] animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl">Recent Messages</CardTitle>
          <CardDescription>
            Preview of recent channel messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-md border border-border/50">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-card h-[400px] animate-slide-up">
      <CardHeader>
        <CardTitle className="text-xl">Recent Messages</CardTitle>
        <CardDescription>
          Preview of recent channel messages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>No messages to display</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id}
                className="p-4 rounded-md border border-border/50 hover:border-border/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://avatar.vercel.sh/${message.username}.png`} />
                    <AvatarFallback>
                      {message.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">@{message.username}</span>
                        {message.processed && (
                          <Badge variant="secondary" className="text-xs font-normal">Reposted</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {message.media && (
                      <div className="mt-2 rounded-md overflow-hidden bg-secondary/50">
                        <img 
                          src={message.media} 
                          alt="Media" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagePreview;
