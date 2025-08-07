import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { chatApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { ChatMessage, DocumentPreviewData } from "@/types";
import { 
  Menu,
  FolderOpen,
  Send,
  Bot,
  User,
  ExternalLink,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatAreaProps {
  sessionId: string;
  onToggleSidebar: () => void;
  onViewAllDocs: () => void;
  onDocumentPreview: (data: DocumentPreviewData) => void;
  isCompact?: boolean;
}

export default function ChatArea({ 
  sessionId, 
  onToggleSidebar, 
  onViewAllDocs,
  onDocumentPreview,
  isCompact = false
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load chat history when session changes
  const { data: chatHistory } = useQuery({
    queryKey: ['/api/chat', sessionId],
    queryFn: () => chatApi.getHistory(sessionId),
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ chatInput, sessionId }: { chatInput: string; sessionId: string }) =>
      chatApi.sendMessage(chatInput, sessionId),
    onSuccess: (aiResponse) => {
      setMessages(prev => [...prev, aiResponse]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat', sessionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (chatHistory) {
      const historyMessages = chatHistory.map((session: any) => session.message);
      setMessages(historyMessages);
    } else {
      // Reset to welcome message for new sessions
      setMessages([{
        type: 'ai',
        content: "Hello! I'm your document assistant. I can help you find information from your uploaded documents. What would you like to know?",
        timestamp: Date.now()
      }]);
    }
  }, [sessionId, chatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
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
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className={`bg-white border-b border-border ${isCompact ? 'px-4 py-3' : 'px-6 py-4'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-semibold text-gray-900 ${isCompact ? 'text-base' : 'text-lg'}`}>
              {isCompact ? 'Chat' : 'Document RAG + Web Search'}
            </h1>
            {!isCompact && (
              <p className="text-sm text-gray-600">Intelligent document analysis with web-enhanced research capabilities</p>
            )}
          </div>
          <div className={`flex items-center ${isCompact ? 'space-x-2' : 'space-x-3'}`}>
            <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
              <Menu className="h-4 w-4" />
            </Button>
            {!isCompact && (
              <Button variant="ghost" size="sm" onClick={onViewAllDocs}>
                <FolderOpen className="mr-2 h-4 w-4" />
                View All Documents
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className={`h-full ${isCompact ? 'p-4' : 'p-6'}`}>
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start space-x-3 ${msg.type === 'human' ? 'justify-end' : ''}`}>
                {msg.type === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="text-white" size={16} />
                  </div>
                )}
                
                <div className={`flex-1 ${msg.type === 'human' ? 'flex justify-end' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-2xl ${
                    msg.type === 'human' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    <p>{msg.content}</p>
                    
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
                          View Document with Highlighted Answer
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {msg.type === 'ai' && (
                    <p className="text-xs text-gray-500 mt-2">
                      AI Assistant • {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                {msg.type === 'human' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="text-gray-600" size={16} />
                  </div>
                )}
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={16} />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">AI Assistant • Thinking...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className={`bg-white border-t border-border ${isCompact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="resize-none pr-12 min-h-[44px] max-h-24"
                rows={1}
              />
              <Button
                size="sm"
                className="absolute right-2 bottom-2"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
