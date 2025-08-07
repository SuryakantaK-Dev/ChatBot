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
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-medium text-gray-900 ml-2">
            Client Engagement Overview
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Documents
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </Button>
          </div>
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
          <div className="flex-1 flex bg-white">
            <div className="flex-1 border-r border-gray-200 max-h-screen bg-white">
              <DocumentPreview
                data={documentPreviewData}
                onClose={handleCloseDocumentPreview}
              />
            </div>
            <div className="w-2/5 bg-white">
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
          // Default layout: Chat centered with proper spacing
          <div className="flex-1 flex justify-center items-start bg-white py-8 pb-0">
            <div className="w-full max-w-4xl mx-auto px-8">
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
