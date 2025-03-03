
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface AuthFormProps {
  onAuthSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        if (onAuthSuccess) onAuthSuccess();
      } else {
        // Validate registration code using the edge function
        const { data, error: validationError } = await supabase.functions.invoke('validate-registration', {
          body: { code: registrationCode }
        });

        if (validationError) throw validationError;

        if (!data.valid) {
          toast({
            title: "Invalid registration code",
            description: "The registration code you entered is incorrect.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email for the confirmation link.",
        });
      }
    } catch (error) {
      toast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{isLoginMode ? "Login" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLoginMode
              ? "Enter your credentials to access your account"
              : "Sign up to start managing your Telegram channels"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor="registrationCode">Registration Code</Label>
                <Input
                  id="registrationCode"
                  type="password"
                  placeholder="Enter the secret registration code"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  required
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Processing..."
                : isLoginMode
                ? "Sign In"
                : "Create Account"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-xs"
            >
              {isLoginMode
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AuthForm;
