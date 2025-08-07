import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { documentsApi } from "@/lib/api";
import { DocumentPreviewData } from "@/types";
import { 
  FileText, 
  FileSpreadsheet, 
  File, 
  Eye, 
  Download,
  X
} from "lucide-react";

interface DocumentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentPreview: (data: DocumentPreviewData) => void;
}

export default function DocumentListModal({ 
  isOpen, 
  onClose, 
  onDocumentPreview 
}: DocumentListModalProps) {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: documentsApi.getAll,
    enabled: isOpen,
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-500" size={20} />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="text-green-600" size={20} />;
      case 'docx':
      case 'doc':
        return <File className="text-blue-600" size={20} />;
      default:
        return <FileText className="text-gray-500" size={20} />;
    }
  };

  const handlePreview = (doc: any) => {
    onDocumentPreview({
      fileName: doc.name,
      fileLink: doc.link,
    });
    onClose();
  };

  const handleDownload = (doc: any) => {
    window.open(doc.link, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            All Documents
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-3 rounded-lg border">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-2 opacity-20" />
              <p>No documents available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div 
                  key={doc.name}
                  className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      uploaded by System | {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreview(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
