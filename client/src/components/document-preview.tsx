import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentPreviewData } from "@/types";
import { X, ExternalLink, Download, FileText } from "lucide-react";

interface DocumentPreviewProps {
  data: DocumentPreviewData;
  onClose: () => void;
}

export default function DocumentPreview({ data, onClose }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isPdf = getFileExtension(data.fileName) === 'pdf';

  const handleDownload = () => {
    window.open(data.fileLink, '_blank');
  };

  const handleOpenFull = () => {
    window.open(data.fileLink, '_blank');
  };

  return (
    <div className="w-96 bg-white border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-4">
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="text-red-500" size={16} />
            <span className="text-sm font-medium text-gray-900">{data.fileName}</span>
          </div>
          {data.from && data.to && (
            <p className="text-xs text-gray-600">
              Showing highlighted content (Lines {data.from}-{data.to})
            </p>
          )}
        </div>
        
        {/* PDF Preview */}
        {isPdf ? (
          <div className="bg-white border border-gray-200 rounded-lg h-96 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm">Loading PDF...</p>
                </div>
              </div>
            )}
            
            <iframe
              src={`${data.fileLink}#view=FitH`}
              className="w-full h-full"
              title={data.fileName}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
            
            {!isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="text-center text-gray-500">
                  <FileText className="mx-auto mb-3" size={48} />
                  <p className="text-sm mb-2">PDF Preview</p>
                  {data.from && data.to && (
                    <p className="text-xs text-gray-400">
                      Lines {data.from}-{data.to} highlighted
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Non-PDF Preview */
          <div className="bg-white border border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="mx-auto mb-3" size={48} />
              <p className="text-sm mb-2">Preview not available</p>
              <p className="text-xs text-gray-400">
                {data.fileName.split('.').pop()?.toUpperCase()} file
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4 space-y-2">
          <Button 
            onClick={handleOpenFull}
            className="w-full bg-primary hover:bg-primary-dark text-white"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Full Document
          </Button>
          <Button 
            onClick={handleDownload}
            variant="secondary"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Document
          </Button>
        </div>
      </div>
    </div>
  );
}
