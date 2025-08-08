import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import ChatArea from "@/components/chat-area";
import DocumentPreview from "@/components/document-preview";
import DocumentListModal from "@/components/document-list-modal";
import LoadingTransition from "@/components/loading-transition";
import WissenLogo from "@/components/wissen-logo";
import { DocumentPreviewData } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut, User, Search } from "lucide-react";
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
      {/* Top Header with Logo and Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        {/* Left - WISSEN Logo */}
        <div className="flex items-center">
          <WissenLogo className="h-8 w-auto" />
        </div>
        
        {/* Center - Title */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Client Engagement Overview</h1>
        </div>
        
        {/* Right - Welcome, View All Documents, Logout */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {username || 'Suryakanta Karan'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAllDocsModalOpen(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            View All Documents
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Search Bar - Below Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-2">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
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
        
        {/* Main Chat Layout - Always Present */}
        <div className="flex-1 flex justify-center items-start bg-gray-50 pt-0 pb-0 relative">
          <div className="w-full max-w-4xl mx-auto px-8">
            <ChatArea
              sessionId={currentSessionId}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onViewAllDocs={() => setIsAllDocsModalOpen(true)}
              onDocumentPreview={handleDocumentPreview}
              isCompact={false}
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
