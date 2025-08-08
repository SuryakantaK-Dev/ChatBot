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
  messages: ChatMessage[];
  onMessagesUpdate: (messages: ChatMessage[]) => void;
}

export default function ChatArea({
  sessionId,
  onToggleSidebar,
  onViewAllDocs,
  onDocumentPreview,
  isCompact,
  messages,
  onMessagesUpdate
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load chat history when session changes
  const { data: chatHistory } = useQuery({
    queryKey: ['/api/chat', sessionId],
    enabled: !!sessionId,
  });


  useEffect(() => {
    if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
      const historyMessages = chatHistory.map((session: any) => session.message);
      onMessagesUpdate(historyMessages);
    } else {
      // Reset to welcome message for new sessions
      onMessagesUpdate([{
        type: 'ai',
        content: "Welcome to the Document Extraction Chatbot\n\nAsk me anything about your documents!",
        timestamp: Date.now()
      }]);
    }
    // Ensure scroll to bottom after loading
    setTimeout(scrollToBottom, 200);
  }, [sessionId, chatHistory, onMessagesUpdate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    // Use timeout to ensure DOM is updated before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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
      {/* Chat Messages - Full height with custom scrollbar */}
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-6 p-6">
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
                  <div className="w-full text-left p-3 border border-gray-200 rounded-lg text-sm">
                    💰 "What is the rate of interest for the Company XYZ?"
                  </div>
                  <div className="w-full text-left p-3 border border-gray-200 rounded-lg text-sm">
                    📊 "Show me the ROI of Company XYZ"
                  </div>
                  <div className="w-full text-left p-3 border border-gray-200 rounded-lg text-sm">
                    📋 "Can you summarize the key financial metrics?"
                  </div>
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
            
            <div ref={messagesEndRef} />
          </div>
        </div>

    </div>
  );
}