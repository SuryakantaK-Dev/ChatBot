import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (chatHistory && Array.isArray(chatHistory)) {
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
    
    // Focus back to textarea and scroll to bottom
    if (textareaRef.current) {
      textareaRef.current.focus();
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)]">
      {/* Only show header in compact mode */}
      {isCompact && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-gray-900">Chat</h1>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-6">
            {messages.length === 1 && messages[0].type === 'ai' && !isCompact && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <h2 className="text-xl text-gray-600 mb-2">Welcome to the Document Extraction Chatbot</h2>
                <p className="text-gray-500">Ask me anything about your documents!</p>
              </div>
            )}
            
            {messages.slice(1).map((msg, index) => (
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
        </ScrollArea>
      </div>

      {/* Chat Input - Always fixed at bottom */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0 bg-white sticky bottom-0">
        <div className={`flex items-center space-x-2 ${isCompact ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={isCompact ? "Type here..." : "Type your message here..."}
              className={`resize-none h-10 overflow-y-auto border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 min-h-10 max-h-10 ${isCompact ? 'pr-3 text-sm' : 'pr-32'}`}
              rows={1}
            />
            {!isCompact && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none whitespace-nowrap">
                Press Enter to send
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className={`rounded-lg p-0 flex-shrink-0 ${isCompact ? 'h-10 w-10' : 'h-10 w-12'}`}
          >
            <Send size={isCompact ? 16 : 18} />
          </Button>
        </div>
      </div>
    </div>
  );
}