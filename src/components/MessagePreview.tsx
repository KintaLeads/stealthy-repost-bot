
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Image } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  media?: string;
  mediaAlbum?: string[]; // Array of media URLs for album
  time: string;
  username: string;
  processed: boolean;
  detectedCompetitors?: string[];
  modifiedText?: string;
  finalText?: string; // Added final text with CTA
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
                        {message.mediaAlbum && message.mediaAlbum.length > 0 && (
                          <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            <Image className="w-3 h-3 mr-1" />
                            Album ({message.mediaAlbum.length})
                          </Badge>
                        )}
                        {message.media && !message.mediaAlbum && (
                          <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            <Image className="w-3 h-3 mr-1" />
                            Media
                          </Badge>
                        )}
                        {message.detectedCompetitors && message.detectedCompetitors.length > 0 && (
                          <Badge variant="destructive" className="text-xs font-normal">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Competitor
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {message.detectedCompetitors && message.detectedCompetitors.length > 0 && message.modifiedText && (
                      <div className="mt-2 p-2 bg-secondary/30 rounded-md border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Detected competitors: {message.detectedCompetitors.join(', ')}</p>
                        <p className="text-sm leading-relaxed text-green-600 dark:text-green-400">
                          <span className="font-medium">Will be reposted as:</span>
                        </p>
                        <div className="mt-1 p-2 bg-background rounded-md border border-border/30 text-sm whitespace-pre-line">
                          {message.finalText || message.modifiedText}
                        </div>
                      </div>
                    )}
                    
                    {/* Display single media */}
                    {message.media && !message.mediaAlbum && (
                      <div className="mt-2 rounded-md overflow-hidden bg-secondary/50">
                        <img 
                          src={message.media} 
                          alt="Media" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Display media album */}
                    {message.mediaAlbum && message.mediaAlbum.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {message.mediaAlbum.map((mediaUrl, index) => (
                          <div key={index} className="rounded-md overflow-hidden bg-secondary/50">
                            <img 
                              src={mediaUrl} 
                              alt={`Album image ${index + 1}`} 
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
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
