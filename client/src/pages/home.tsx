import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Generate initial session ID
    setCurrentSessionId(generateSessionId());
    
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
      {/* Header with welcome message */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">
            Welcome {username} to ChatBot
          </h1>
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
        />
        
        {/* Dynamic Layout Based on Document Preview State */}
        {isDocumentPreviewOpen && documentPreviewData ? (
          // Layout when document is open: Document in middle, Chat on right
          <div className="flex-1 flex">
            <div className="flex-1 border-r border-gray-200">
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
              />
            </div>
          </div>
        ) : (
          // Default layout: Chat centered in middle
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-6xl">
              <ChatArea
                sessionId={currentSessionId}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                onViewAllDocs={() => setIsAllDocsModalOpen(true)}
                onDocumentPreview={handleDocumentPreview}
                isCompact={false}
              />
            </div>
          </div>
        )}
      </div>

      <DocumentListModal
        isOpen={isAllDocsModalOpen}
        onClose={() => setIsAllDocsModalOpen(false)}
        onDocumentPreview={handleDocumentPreview}
      />
    </div>
  );
}
