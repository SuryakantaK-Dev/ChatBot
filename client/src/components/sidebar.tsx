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
            const firstUserMessage = chatHistory.find((msg: any) => msg.role === 'user');
            const previewText = firstUserMessage ? firstUserMessage.content : 'New Chat';
            
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
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        {/* Minimized Header */}
        <div className="p-3 border-b border-gray-200">
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
        <div className="mt-auto p-2 border-t border-gray-200">
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
    <div className="w-80 bg-white border-r border-border flex flex-col">
      {/* Logo/Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <WissenLogo className="h-8" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="p-2"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">

          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Chat Sessions</h3>
            <Button variant="ghost" size="sm">
              <Trash2 className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          </div>
          


          <ScrollArea className="h-[calc(100vh-280px)]">
            {filteredSessions.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <History className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">
                  {searchQuery ? 'No sessions match your search' : 'No chat history yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentSessionId === session.id
                        ? 'bg-blue-100 border-2 border-primary'
                        : 'border border-gray-200 hover:border-primary hover:bg-blue-50'
                    }`}
                    onClick={() => onSessionChange(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.previewText}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatSessionTime(session.id)} • {session.messageCount} messages
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          Chat
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSessionMutation.mutate(session.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* History Pagination */}
          {filteredSessions.length > 0 && totalHistoryPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Showing {((historyPage - 1) * itemsPerPage) + 1}-{Math.min(historyPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryPage(prev => Math.max(prev - 1, 1))}
                  disabled={historyPage === 1}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs px-2 py-1 text-gray-600">
                  {historyPage} / {totalHistoryPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                  disabled={historyPage === totalHistoryPages}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onNewChat}
          className="w-full bg-primary hover:bg-primary-dark text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>


    </div>
  );
}