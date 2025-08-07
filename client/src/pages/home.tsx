import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import ChatArea from "@/components/chat-area";
import DocumentPreview from "@/components/document-preview";
import DocumentListModal from "@/components/document-list-modal";
import { DocumentPreviewData } from "@/types";

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDocumentPreviewOpen, setIsDocumentPreviewOpen] = useState(false);
  const [isAllDocsModalOpen, setIsAllDocsModalOpen] = useState(false);
  const [documentPreviewData, setDocumentPreviewData] = useState<DocumentPreviewData | null>(null);

  useEffect(() => {
    // Generate initial session ID
    setCurrentSessionId(generateSessionId());
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        currentSessionId={currentSessionId}
        onSessionChange={setCurrentSessionId}
        onNewChat={handleNewChat}
        onDocumentPreview={handleDocumentPreview}
      />
      
      <div className="flex-1 flex relative">
        <ChatArea
          sessionId={currentSessionId}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onViewAllDocs={() => setIsAllDocsModalOpen(true)}
          onDocumentPreview={handleDocumentPreview}
        />
        
        {isDocumentPreviewOpen && documentPreviewData && (
          <div className="absolute top-0 right-0 h-full z-10 shadow-2xl">
            <DocumentPreview
              data={documentPreviewData}
              onClose={handleCloseDocumentPreview}
            />
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
