import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingTransition from "@/components/loading-transition";
import WissenLogo from "@/components/wissen-logo";

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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <WissenLogo className="h-12" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm">
              Sign in to access your document extraction chatbot
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={loginMutation.isPending}
                  className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loginMutation.isPending}
                  className="pl-12 pr-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Demo Credentials Section */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Demo Credentials:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="font-medium">Username:</span> Suryakanta.Karan</div>
              <div><span className="font-medium">Password:</span> ••••••••</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}