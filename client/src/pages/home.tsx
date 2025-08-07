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
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex-1"></div>
        <h1 className="text-lg font-medium text-gray-900">Client Engagement Overview</h1>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsAllDocsModalOpen(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Documents
          </button>
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
          // Default layout: Clean centered layout with flexible content
          <div className="flex-1 flex flex-col bg-white">
            <div className="flex-1 flex items-center justify-center min-h-0 py-8">
              <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-8">
                  <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                    </svg>
                  </div>
                  
                  <h2 className="text-xl text-gray-700 font-medium">Hi there, what can I help you with today?</h2>
                  
                  <div className="space-y-3 max-w-md mx-auto">
                    <button className="w-full py-3 px-6 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-700 text-sm">
                      What's the start date?
                    </button>
                    <button className="w-full py-3 px-6 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-700 text-sm">
                      Summarize the document
                    </button>
                    <button className="w-full py-3 px-6 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-700 text-sm">
                      Who are the service providers?
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bottom Message Input */}
            <div className="p-4 sm:p-6 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    className="w-full py-4 px-6 pr-14 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 placeholder-gray-400 bg-white"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DocumentListModal
          isOpen={isAllDocsModalOpen}
          onClose={() => setIsAllDocsModalOpen(false)}
          onDocumentPreview={handleDocumentPreview}
        />
      </div>
    </div>
  );
}
