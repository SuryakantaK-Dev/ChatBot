import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Bot, User, Send, Menu, FolderOpen, FileText, ExternalLink } from "lucide-react";

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

interface DocumentPreviewData {
  fileName: string;
  fileLink: string;
  from?: number;
  to?: number;
}

interface ChatAreaProps {
  sessionId: string;
  onToggleSidebar: () => void;
  onViewAllDocs: () => void;
  onDocumentPreview: (data: DocumentPreviewData) => void;
  isCompact: boolean;
}

export default function ChatArea({
  sessionId,
  onToggleSidebar,
  onViewAllDocs,
  onDocumentPreview,
  isCompact
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load chat history when session changes
  const { data: chatHistory } = useQuery({
    queryKey: ['/api/chat', sessionId],
    enabled: !!sessionId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      const historyMessages = chatHistory.map((session: any) => session.message);
      setMessages(historyMessages);
    } else {
      // Reset to welcome message for new sessions
      setMessages([{
        type: 'ai',
        content: "Welcome to the Document Extraction Chatbot\n\nAsk me anything about your documents!",
        timestamp: Date.now()
      }]);
    }
    // Ensure scroll to bottom after loading
    setTimeout(scrollToBottom, 200);
  }, [sessionId, chatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessageMutation.isPending]);

  const scrollToBottom = () => {
    // Use timeout to ensure DOM is updated before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      type: 'human',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    
    // Focus back to input and scroll to bottom
    if (inputRef.current) {
      inputRef.current.focus();
    }
    scrollToBottom();

    sendMessageMutation.mutate({
      chatInput: message,
      sessionId: sessionId
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
    // Fixed height - no auto-resize to prevent stretching
  };

  const handleDocumentReference = (docRef: any) => {
    onDocumentPreview({
      fileName: docRef.fileName,
      fileLink: docRef.fileLink,
      from: docRef.from,
      to: docRef.to,
    });
  };

  return (
    <div className="bg-white h-full">
      {/* Chat Messages - Fixed height with visible scrollbar */}
      <div className="overflow-y-auto overflow-x-hidden border-r border-gray-100 chat-scrollbar" style={{ height: 'calc(100% - 80px)' }}>
        <div className="space-y-6 p-6 pb-4">
            {/* Welcome Screen - Only shown when there's exactly one welcome message and not in compact mode */}
            {messages.length === 1 && messages[0].type === 'ai' && messages[0].content.includes('Welcome to the Document Extraction Chatbot') && !isCompact && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-6">
                  <Bot className="w-12 h-12 mx-auto mb-2 text-primary" />
                </div>
                <p className="text-gray-600 mb-4">Welcome to the Document Extraction Chatbot</p>
                <p className="text-sm text-gray-500 mb-6">Ask me anything about your documents!</p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <p className="text-sm font-medium text-gray-700 mb-3">Try these sample questions:</p>
                  <button
                    onClick={() => setMessage("What is the rate of interest for the Company XYZ?")}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    💰 "What is the rate of interest for the Company XYZ?"
                  </button>
                  <button
                    onClick={() => setMessage("Show me the ROI of Company XYZ")}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    📊 "Show me the ROI of Company XYZ"
                  </button>
                  <button
                    onClick={() => setMessage("Can you summarize the key financial metrics?")}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    📋 "Can you summarize the key financial metrics?"
                  </button>
                </div>
              </div>
            )}
            
            {/* Regular Messages - Show all messages except the initial welcome message when in welcome mode */}
            {(messages.length > 1 || (messages.length === 1 && !messages[0].content.includes('Welcome to the Document Extraction Chatbot'))) &&
              messages.filter(msg => !(msg.type === 'ai' && msg.content.includes('Welcome to the Document Extraction Chatbot') && messages.length > 1))
                .map((msg, index) => (
              <div key={index} className="w-full">
                <div className={`flex items-start space-x-3 ${msg.type === 'human' ? 'justify-end' : ''}`}>
                  {msg.type === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="text-white" size={16} />
                    </div>
                  )}
                  
                  <div className={`flex-1 ${msg.type === 'human' ? 'flex justify-end' : ''}`}>
                    <div className={`max-w-2xl ${
                      msg.type === 'human' 
                        ? 'bg-primary text-white rounded-2xl px-4 py-3' 
                        : 'bg-gray-50 rounded-2xl px-4 py-3'
                    }`}>
                      <p className={`whitespace-pre-line ${msg.type === 'human' ? 'text-white' : 'text-gray-800'}`}>{msg.content}</p>
                      
                      {msg.documentReference && (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 mt-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="text-red-500" size={16} />
                            <span className="text-sm font-medium text-gray-900">
                              {msg.documentReference.fileName}
                            </span>
                          </div>
                          {msg.documentReference.from && msg.documentReference.to && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-600">
                                Reference: Lines {msg.documentReference.from}-{msg.documentReference.to}
                              </span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary-dark p-0 h-auto font-medium"
                            onClick={() => handleDocumentReference(msg.documentReference)}
                          >
                            <ExternalLink className="mr-1" size={12} />
                            View Document Preview
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {msg.type === 'human' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="text-gray-600" size={16} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={16} />
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
            
            <div ref={messagesEndRef} />
          </div>
      </div>

      {/* Chat Input - Fixed height at bottom, completely static */}
      <div className="border-t border-gray-100 px-6 py-4 bg-white" style={{ height: '80px' }}>
        <div className="flex items-center space-x-3 h-full">
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
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white p-0 flex-shrink-0 shadow-sm"
            style={{ height: '48px', width: '48px', minHeight: '48px', minWidth: '48px' }}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>

    </div>
  );
}