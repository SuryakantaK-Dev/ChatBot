import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import WissenLogo from "@/components/wissen-logo";
import { sessionsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { 
  History, 
  Plus, 
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  User
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  isMinimized: boolean;
  currentSessionId: string;
  onSessionChange: (sessionId: string) => void;
  onNewChat: () => void;
  onToggleMinimize: () => void;
  onDocumentPreview: (data: any) => void;
}

export default function Sidebar({ 
  isOpen, 
  isMinimized,
  currentSessionId, 
  onSessionChange, 
  onNewChat,
  onToggleMinimize
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: sessionsApi.getAll,
  });

  // Fetch chat history for each session to get preview text
  const { data: sessionsWithContent = [] } = useQuery({
    queryKey: ['/api/sessions-with-content', sessions],
    queryFn: async () => {
      if (!sessions.length) return [];
      
      const sessionsData = await Promise.all(
        sessions.map(async (sessionId) => {
          try {
            const response = await fetch(`/api/chat/${sessionId}`);
            const chatHistory = await response.json();
            
            // Get the first user message for preview
            const firstUserMessage = chatHistory.find((msg: any) => msg.message?.type === 'human');
            const previewText = firstUserMessage ? firstUserMessage.message.content : 'Empty Chat';
            
            return {
              id: sessionId,
              previewText: previewText.length > 50 ? previewText.substring(0, 50) + '...' : previewText,
              messageCount: chatHistory.length,
              lastActivity: chatHistory.length > 0 ? new Date(chatHistory[chatHistory.length - 1].created_at) : new Date()
            };
          } catch (error) {
            return {
              id: sessionId,
              previewText: 'Chat Session',
              messageCount: 0,
              lastActivity: new Date()
            };
          }
        })
      );
      
      // Sort by last activity
      return sessionsData.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    },
    enabled: sessions.length > 0,
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: sessionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    },
  });

  // Format session time for display
  const formatSessionTime = (sessionId: string) => {
    const timestamp = sessionId.split('_')[1];
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(parseInt(timestamp));
    return date.toLocaleString();
  };

  // Filter and paginate sessions based on search query
  const filteredSessions = sessionsWithContent.filter(session =>
    session.previewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalHistoryPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setHistoryPage(1);
  }, [searchQuery]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="w-16 bg-white flex flex-col">
        {/* Minimized Header */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimize}
                className="w-full p-2"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand Sidebar</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Minimized Actions */}
        <div className="p-2 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewChat}
                className="w-full p-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New Chat</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Minimized Logo & Developer Info */}
        <div className="mt-auto p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center">
                <div className="text-xs font-semibold text-blue-600 mb-1">W</div>
                <User className="h-3 w-3 text-gray-400 mx-auto" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="text-xs">
                <div className="font-semibold">Developed By:</div>
                <div>Suryakanta Karan</div>
                <div className="text-blue-600">Wissen Technology</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white flex flex-col border-r border-gray-100">
      {/* Logo and Search */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <WissenLogo className="h-8" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="p-1"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-lg border-gray-200 bg-gray-50 focus:bg-white text-sm h-10"
          />
        </div>
      </div>

      {/* Chats Section */}
      <div className="px-6 py-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Chats</h3>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-6">
        <nav className="space-y-2">
          <div className="text-sm font-semibold text-gray-900 py-2 bg-blue-50 px-3 rounded-lg">
            Client Engagement Overview
          </div>
          <div className="text-sm text-gray-600 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            Project Milestones
          </div>
          <div className="text-sm text-gray-600 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            Team Collab Insights
          </div>
          <div className="text-sm text-gray-600 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            Weekly Progress Summary
          </div>
          <div className="text-sm text-gray-600 py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            Feedback and Adjustments Log
          </div>
        </nav>
      </div>

      {/* New Chat Button */}
      <div className="p-6 border-t border-gray-100">
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>
    </div>
  );
}