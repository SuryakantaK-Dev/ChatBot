import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/sidebar";
import ChatArea from "@/components/chat-area";
import DocumentPreview from "@/components/document-preview";
import DocumentListModal from "@/components/document-list-modal";
import LoadingTransition from "@/components/loading-transition";
import WissenLogo from "@/components/wissen-logo";
import { DocumentPreviewData } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Send } from "lucide-react";
import { clearSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ChatMessage {
  type: 'human' | 'ai';
  content: string;
  timestamp: number;
  documentReference?: {
    fileName: string;
    fileLink: string;
    from?: number;
    to?: number;
  };
}

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [isAllDocsModalOpen, setIsAllDocsModalOpen] = useState(false);
  const [documentPreviewData, setDocumentPreviewData] = useState<DocumentPreviewData | null>(null);
  const [username, setUsername] = useState<string>("");
  const [showLogoutTransition, setShowLogoutTransition] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Generate initial session ID
    setCurrentSessionId(generateSessionId());
    
    // Initialize welcome message
    setMessages([{
      type: 'ai',
      content: "Welcome to the Document Extraction Chatbot\n\nAsk me anything about your documents!",
      timestamp: Date.now()
    }]);
    
    // Get username from session storage
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername.replace('.', ' ')); // Convert "Suryakanta.Karan" to "Suryakanta Karan"
    }
  }, []);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleNewChat = () => {
    setCurrentSessionId(generateSessionId());
    setMessages([{
      type: 'ai',
      content: "Welcome to the Document Extraction Chatbot\n\nAsk me anything about your documents!",
      timestamp: Date.now()
    }]);
    setMessage("");
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatInput, sessionId }: { chatInput: string; sessionId: string }) => {
      try {
        const response = await apiRequest('POST', '/api/chat', { chatInput, sessionId });
        return await response.json();
      } catch (error) {
        console.error('Chat API error:', error);
        throw error;
      }
    },
    onSuccess: (aiResponse) => {
      setMessages(prev => [...prev, aiResponse]);
      setIsPending(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chat', currentSessionId] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      setIsPending(false);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      type: 'human',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsPending(true);
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    sendMessageMutation.mutate({
      chatInput: message,
      sessionId: currentSessionId
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleMessagesUpdate = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
  };

  const handleDocumentPreview = (data: DocumentPreviewData) => {
    setDocumentPreviewData(data);
    setIsDocumentPreviewOpen(true);
  };

  const handleCloseDocumentPreview = () => {
    setIsDocumentPreviewOpen(false);
    setDocumentPreviewData(null);
  };

  const handleLogout = () => {
    setShowLogoutTransition(true);
    
    toast({
      title: "Logging Out",
      description: "Securely ending your session...",
    });
    
    setTimeout(() => {
      clearSession();
      // The App component will detect the session change and show login
    }, 1500);
  };

  if (showLogoutTransition) {
    return <LoadingTransition message="Logging you out securely..." duration={1500} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center">
        <div className="flex items-center">
          <WissenLogo className="h-8" />
        </div>
        
        {/* Vertical Separator */}
        <div className="h-8 w-px bg-gray-300 mx-6"></div>
        
        <div className="flex-1 flex justify-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Client Engagement Overview
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {username || 'Suryakanta.Karan'}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsAllDocsModalOpen(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Documents
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          isMinimized={isSidebarMinimized}
          currentSessionId={currentSessionId}
          onSessionChange={setCurrentSessionId}
          onNewChat={handleNewChat}
          onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
          onDocumentPreview={handleDocumentPreview}
        />
        
        {/* Dynamic Layout Based on Document Preview State */}
        {isDocumentPreviewOpen && documentPreviewData ? (
          // Layout when document is open: Document in middle, Chat on right
          <div className="flex-1 flex">
            <div className="flex-1 border-r border-gray-200 max-h-screen">
              <DocumentPreview
                data={documentPreviewData}
                onClose={handleCloseDocumentPreview}
              />
            </div>
            <div className="w-2/5">
              <ChatArea
                sessionId={currentSessionId}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onViewAllDocs={() => setIsAllDocsModalOpen(true)}
                onDocumentPreview={handleDocumentPreview}
                isCompact={true}
                messages={messages}
                onMessagesUpdate={handleMessagesUpdate}
              />
            </div>
          </div>
        ) : (
          // Default layout: Chat aligned with sidebar border
          <div className="flex-1 flex justify-center items-start bg-gray-50 pt-0 pb-20">
            <div className="w-full max-w-4xl mx-auto px-8">
              <ChatArea
                sessionId={currentSessionId}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onViewAllDocs={() => setIsAllDocsModalOpen(true)}
                onDocumentPreview={handleDocumentPreview}
                isCompact={false}
                messages={messages}
                onMessagesUpdate={handleMessagesUpdate}
              />
              {isPending && (
                <div className="flex items-start space-x-3 px-6 pb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unified Bottom Bar - New Chat + Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center space-x-4 shadow-lg">
        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center space-x-2 flex-shrink-0"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </Button>

        {/* Chat Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="w-full resize-none border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-4 py-3 pr-44 overflow-hidden shadow-sm outline-none"
            style={{ height: '48px', minHeight: '48px', maxHeight: '48px', lineHeight: '20px' }}
          />
          <span className="absolute right-16 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none whitespace-nowrap select-none">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isPending}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white p-0 flex-shrink-0 shadow-sm"
          style={{ height: '48px', width: '48px', minHeight: '48px', minWidth: '48px' }}
        >
          <Send size={18} />
        </Button>
      </div>

      <DocumentListModal
        isOpen={isAllDocsModalOpen}
        onClose={() => setIsAllDocsModalOpen(false)}
        onDocumentPreview={handleDocumentPreview}
      />
    </div>
  );
}
