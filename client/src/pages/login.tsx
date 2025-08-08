import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingTransition from "@/components/loading-transition";

interface LoginResponse {
  success: boolean;
  message: string;
  sessionId: string;
  user: {
    username: string;
  };
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data: LoginResponse = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        // Store session info
        sessionStorage.setItem('sessionId', data.sessionId);
        sessionStorage.setItem('username', data.user.username);
        
        toast({
          title: "Welcome to WISSEN ChatBot!",
          description: `Welcome ${data.user.username.replace('.', ' ')} to WISSEN ChatBot`,
        });
        
        // Show loading transition before redirect
        setShowTransition(true);
        
        setTimeout(() => {
          setLocation('/');
        }, 1500);
      } else {
        toast({
          title: "Login Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Error",
        description: error.message || "Failed to login. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ username, password });
  };

  if (showTransition) {
    return <LoadingTransition message="Preparing your workspace..." duration={1500} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">WISSEN Chatbot</CardTitle>
          <CardDescription>
            Sign in to access your document assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loginMutation.isPending}
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
                placeholder="Enter your password"
                disabled={loginMutation.isPending}
                required
              />
            </div>
            
            {/* Demo credentials info */}
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Demo Credentials:</strong><br />
                Username: Suryakanta.Karan<br />
                Password: *********
              </AlertDescription>
            </Alert>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        
        {/* Developer Credit */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-gray-400">Developed By - Suryakanta Karan</p>
        </div>
      </Card>
    </div>
  );
}