import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

interface LoadingTransitionProps {
  message?: string;
  duration?: number;
}

export default function LoadingTransition({ 
  message = "Loading WISSEN ChatBot...", 
  duration = 1000 
}: LoadingTransitionProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (duration / 50)); // Update every 50ms
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-6 max-w-md mx-auto px-6">
        <div className="bg-primary rounded-full p-4 animate-pulse">
          <FileText className="h-12 w-12 text-white" />
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">WISSEN ChatBot</h2>
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center text-sm text-gray-500 mt-2">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}