import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { DocumentPreviewData } from "@/types";
import {
  FileText,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  X,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { n8nApi } from "@/lib/api"; // CHANGED

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // CHANGED: call n8n webhook on open
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['file-load-history', isOpen],
    queryFn: n8nApi.getFileLoadHistory,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      console.log('[UI] file-load-history data:', raw);
    }
  }, [isOpen, raw]);

  const coerceName = (item: any) =>
    item?.name ?? item?.fileName ?? item?.FileName ?? item?.title ?? 'Untitled';

  const coerceLink = (item: any) =>
    item?.link ?? item?.fileLink ?? item?.FileLink ?? item?.url ?? null;

  const documents = useMemo(() => {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.items)) return raw.items;
    return [];
  }, [raw]);

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

  const toDrivePreview = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      // file/d/<id>/...
      let m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/);
      if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
      // open?id=<id> or uc?id=<id> or ?id=<id>
      m = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
      // share links with /d/<id>
      m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (m?.[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
      return url;
    } catch {
      return url;
    }
  };

  const handlePreview = (doc: any) => {
    const name = coerceName(doc);
    const link = toDrivePreview(coerceLink(doc));  // normalize to preview
    if (link) {
      onDocumentPreview({ fileName: name, fileLink: link });
      onClose();
    }
  };

  const handleDownload = (doc: any) => {
    const link = coerceLink(doc);
    if (link) window.open(link, '_blank'); // keep download behavior on Download button
  };

  // Filter and paginate documents
  const filteredDocuments = documents.filter((doc: any) =>
    coerceName(doc).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
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

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="max-h-80">
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
          ) : Array.isArray(paginatedDocuments) && paginatedDocuments.length > 0 ? (
            <div className="space-y-3">
              {paginatedDocuments.map((doc: any, idx: number) => {
                const name = coerceName(doc);
                const link = coerceLink(doc);
                return (
                  <div
                    key={`${name}-${idx}`}
                    className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {link ? 'link available' : 'no link'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                        disabled={!link}
                        title={link ? 'Preview' : 'No preview link'}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={!link}
                        title={link ? 'Download' : 'No download link'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback: show the raw JSON if structure is unknown
            <pre className="text-xs whitespace-pre-wrap break-all p-3 bg-gray-50 rounded border">
{JSON.stringify(raw, null, 2)}
            </pre>
          )}
        </ScrollArea>

        {Array.isArray(filteredDocuments) && filteredDocuments.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm px-3 py-1 bg-gray-100 rounded-md">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
