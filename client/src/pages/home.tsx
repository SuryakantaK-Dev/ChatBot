import { useState, useEffect, useMemo } from "react";
import Sidebar from "@/components/sidebar";
import ChatArea from "@/components/chat-area";
import DocumentPreview from "@/components/document-preview";
import DocumentListModal from "@/components/document-list-modal";
import LoadingTransition from "@/components/loading-transition";
import WissenLogo from "@/components/wissen-logo";
import { DocumentPreviewData } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { clearSession } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { chatApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query"; // Ensure useQuery is imported
import { sessionsApi } from "@/lib/api"; // Ensure sessionsApi is imported

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [isAllDocsModalOpen, setIsAllDocsModalOpen] = useState(false);
  const [documentPreviewData, setDocumentPreviewData] = useState<DocumentPreviewData | null>(null);
  const [username, setUsername] = useState<string>("");
  const [showLogoutTransition, setShowLogoutTransition] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const { toast } = useToast();
  // Add sessionPreviews state
  const [sessionPreviews, setSessionPreviews] = useState<{ [sessionId: string]: string }>({});
  const [createdSessions, setCreatedSessions] = useState<string[]>([]);

  // ALL HOOKS MUST BE DECLARED HERE, AT THE TOP LEVEL OF THE COMPONENT

  // Fetch sessions here (this useQuery was already here)
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: sessionsApi.getAll,
  });

  // This useMemo MUST be before any conditional returns
  const mergedSessions = useMemo(() => {
    const set = new Set([...sessions, ...createdSessions]);
    return Array.from(set);
  }, [sessions, createdSessions]);

  // This useEffect (for initial session ID and username) MUST be before any conditional returns
  useEffect(() => {
    // Generate initial session ID
    setCurrentSessionId(generateSessionId());

    // Get username from session storage
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername.replace('.', ' ')); // Convert "Suryakanta.Karan" to "Suryakanta Karan"
    }
  }, []);

  // This useEffect (for fetching session history previews) MUST be before any conditional returns
  useEffect(() => {
    if (!Array.isArray(sessions)) return;
    sessions.forEach(async (sessionId) => {
      if (!sessionPreviews[sessionId]) {
        try {
          const history = await chatApi.getHistory(sessionId);
          if (Array.isArray(history) && history.length > 0 && history[0].message?.content) {
            setSessionPreviews(prev => ({
              ...prev,
              [sessionId]: history[0].message.content
            }));
          }
        } catch (e) {
          // ignore errors for now
        }
      }
    });
  }, [sessions]);


  // All other functions and conditional returns come AFTER all hooks
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleNewChat = () => {
    if (currentSessionId && !createdSessions.includes(currentSessionId)) {
      setCreatedSessions(prev => [...prev, currentSessionId]);
    }
    setCurrentSessionId(generateSessionId());
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

  // This is the ONLY conditional return that should be here
  if (showLogoutTransition) {
    return <LoadingTransition message="Logging you out securely..." duration={1500} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header with welcome message */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <WissenLogo className="h-6 w-auto" />
          <span className="text-sm text-gray-500">
            Welcome, Suryakanta Karan
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
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
          sessionPreviews={sessionPreviews}
          sessions={mergedSessions}
        />
        
        {/* Main Chat Layout - Always Present */}
        <div className="flex-1 flex justify-center items-start bg-gray-50 pt-0 pb-0 relative">
          <div className="w-full max-w-4xl mx-auto px-8">
            <ChatArea
              sessionId={currentSessionId}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onViewAllDocs={() => setIsAllDocsModalOpen(true)}
              onDocumentPreview={handleDocumentPreview}
              isCompact={false}
              sessionPreviews={sessionPreviews}
              setSessionPreviews={setSessionPreviews}
            />
          </div>
          
          {/* PDF Overlay - 70% width from right */}
          {isDocumentPreviewOpen && documentPreviewData && (
            <>
              {/* Dimmed Backdrop */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-40 z-40"
                onClick={handleCloseDocumentPreview}
              />
              
              {/* PDF Modal - 70% width from right side */}
              <div className="absolute top-0 right-0 w-[70%] h-full bg-white shadow-2xl z-50 border-l border-gray-300">
                <DocumentPreview
                  data={documentPreviewData}
                  onClose={handleCloseDocumentPreview}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <DocumentListModal
        isOpen={isAllDocsModalOpen}
        onClose={() => setIsAllDocsModalOpen(false)}
        onDocumentPreview={handleDocumentPreview}
      />
    </div>
  );
}
