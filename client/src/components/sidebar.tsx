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
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch chat sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: sessionsApi.getAll,
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

  // Filter and paginate sessions
  const filteredSessions = sessions.filter(sessionId =>
    sessionId.toLowerCase().includes(historySearchQuery.toLowerCase())
  );
  const totalHistoryPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setHistoryPage(1);
  }, [historySearchQuery]);

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

  // Document categories for organized display
  const documentCategories = [
    {
      id: 'capital-questions',
      title: 'Capital Questions',
      subtitle: 'What is the capital of France?',
      isActive: false
    },
    {
      id: 'apple-supplier',
      title: 'Apple Supplier Agreement',
      subtitle: 'Apple supplier delivery terms',
      isActive: false
    },
    {
      id: 'tata-board',
      title: 'Tata Industries Board',
      subtitle: 'Key directors in Tata board',
      isActive: false
    },
    {
      id: 'current-session',
      title: 'Current Session',
      subtitle: 'Active chat session',
      isActive: true
    }
  ];


  return (
    <div className="w-80 bg-white border-r border-border flex flex-col">
      {/* Logo/Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
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
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search"
            className="pl-10 h-9 text-sm border-gray-200"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Chats Section */}
            <div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Chats</h3>
              <div className="space-y-1">
                {documentCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                      category.isActive
                        ? 'bg-gray-100 border-l-2 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onSessionChange(currentSessionId)}
                  >
                    <div className="text-sm font-medium text-gray-900">{category.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{category.subtitle}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </ScrollArea>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Developer Info Footer - Ultra Minimal */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="text-center text-xs text-gray-400">
          By Suryakanta Karan
        </div>
      </div>
    </div>
  );
}