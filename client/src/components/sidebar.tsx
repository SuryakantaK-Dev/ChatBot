import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { documentsApi, sessionsApi, chatApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Document, DocumentPreviewData } from "@/types";
import { 
  FileText, 
  History, 
  Plus, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  File,
  FileSpreadsheet
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  currentSessionId: string;
  onSessionChange: (sessionId: string) => void;
  onNewChat: () => void;
  onDocumentPreview: (data: DocumentPreviewData) => void;
}

export default function Sidebar({ 
  isOpen, 
  currentSessionId, 
  onSessionChange, 
  onNewChat,
  onDocumentPreview 
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'history'>('documents');

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: documentsApi.getAll,
    retry: 1,
  });

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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-500" size={18} />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="text-green-600" size={18} />;
      case 'docx':
      case 'doc':
        return <File className="text-blue-600" size={18} />;
      default:
        return <FileText className="text-gray-500" size={18} />;
    }
  };

  const getFileSize = (fileName: string) => {
    // Mock file sizes for display
    const sizes = ['2.4 MB', '1.2 MB', '890 KB', '3.1 MB', '756 KB'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  };

  const getFileType = (fileName: string) => {
    return fileName.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getTimeAgo = (index: number) => {
    const times = ['2 days ago', '1 day ago', '3 days ago', '5 hours ago', '1 week ago'];
    return times[index % times.length];
  };

  const handleDocumentClick = (doc: Document) => {
    onDocumentPreview({
      fileName: doc.name,
      fileLink: doc.link,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-r border-border flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold text-gray-800">
            WISSEN <span className="text-primary">W</span>
          </div>
        </div>
        <h2 className="text-sm font-medium text-gray-600 mt-2">Document Chatbot</h2>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('documents')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documents
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setActiveTab('history')}
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Documents Panel */}
      {activeTab === 'documents' && (
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Available Documents</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetchDocuments()}
                disabled={documentsLoading}
              >
                <RefreshCw className={`mr-1 h-3 w-3 ${documentsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-300px)]">
              {documentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-3 rounded-lg border border-gray-200">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No documents available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={doc.name}
                      className="group p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      onClick={() => handleDocumentClick(doc)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getFileIcon(doc.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getFileType(doc.name)} • {getFileSize(doc.name)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Uploaded {getTimeAgo(index)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* History Panel */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Chat Sessions</h3>
              <Button variant="ghost" size="sm">
                <Trash2 className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100vh-300px)]">
              {sessions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <History className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No chat history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((sessionId, index) => (
                    <div
                      key={sessionId}
                      className={`group p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        sessionId === currentSessionId
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-200 hover:border-primary hover:bg-blue-50'
                      }`}
                      onClick={() => onSessionChange(sessionId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Session {index + 1}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {sessionId.split('_')[1] ? new Date(parseInt(sessionId.split('_')[1])).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSessionMutation.mutate(sessionId);
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
          </div>
        </div>
      )}

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
