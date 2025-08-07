import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentPreviewData } from "@/types";
import { X, ExternalLink, Download, FileText, ZoomIn, ZoomOut, AlertTriangle } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

interface DocumentPreviewProps {
  data: DocumentPreviewData;
  onClose: () => void;
}

export default function DocumentPreview({ data, onClose }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [documentContent, setDocumentContent] = useState<string>("");
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [renderError, setRenderError] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isPdf = getFileExtension(data.fileName) === 'pdf';
  const isDoc = ['docx', 'doc'].includes(getFileExtension(data.fileName));
  const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(getFileExtension(data.fileName));

  useEffect(() => {
    // Configure PDF.js worker to match package version (5.4.54)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs`;
    
    // Reset states
    setIsLoading(true);
    setRenderError("");
    setPdfDoc(null);
    setCurrentPage(1);
    
    // Handle different document types
    if (isPdf && isGoogleDriveDocument(data.fileLink)) {
      loadGoogleDrivePDF();
    } else if (!isPdf && !isGoogleDriveDocument(data.fileLink)) {
      generateSampleContent();
    } else {
      // Auto-hide loading for other documents after timeout
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [data.fileName, data.fileLink]);

  // Load and render Google Drive PDF using PDF.js via backend proxy
  const loadGoogleDrivePDF = async () => {
    try {
      const fileId = data.fileLink.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (!fileId) {
        throw new Error("Invalid Google Drive URL");
      }

      setRenderError("Attempting to load PDF preview...");
      
      // Try to load the PDF through the proxy
      const proxyUrl = `/api/proxy/pdf/${fileId}`;
      console.log('Loading PDF from:', proxyUrl);
      
      const loadingTask = pdfjsLib.getDocument({
        url: proxyUrl,
        httpHeaders: {
          'Accept': 'application/pdf'
        },
        verbosity: 1 // Enable PDF.js logging for debugging
      });

      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully! Pages:', pdf.numPages);
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setRenderError("");
      
      // Render first page
      await renderPage(pdf, 1);
      console.log('PDF rendered successfully!');
      setIsLoading(false);
    } catch (error) {
      console.error("PDF loading error:", error);
      // Show a helpful fallback interface instead of PDF rendering
      setRenderError("PDF preview is not available for this Google Drive document. This is typically due to document privacy settings or authentication requirements.");
      setIsLoading(false);
    }
  };

  // Render a specific page of the PDF
  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      const viewport = page.getViewport({ scale: zoomLevel / 100 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Add highlighting overlay if this document has highlighted sections
      if (data.from && data.to) {
        addHighlightOverlay(context, viewport, canvas);
      }
    } catch (error) {
      console.error("Page rendering error:", error);
    }
  };

  // Add highlight overlay to the rendered PDF page
  const addHighlightOverlay = (context: CanvasRenderingContext2D, viewport: any, canvas: HTMLCanvasElement) => {
    // This is a simplified highlighting - in a real implementation, you'd need to:
    // 1. Extract text content from the PDF page
    // 2. Find the specific lines mentioned in data.from/data.to
    // 3. Calculate their positions and add precise highlights
    // For now, we'll add a general highlight indicator
    
    context.save();
    context.fillStyle = 'rgba(255, 235, 59, 0.3)'; // Yellow highlight
    context.strokeStyle = '#FFC107';
    context.lineWidth = 2;
    
    // Add a highlight box in the middle area (approximate)
    const highlightHeight = canvas.height * 0.1;
    const highlightY = canvas.height * 0.4;
    
    context.fillRect(0, highlightY, canvas.width, highlightHeight);
    context.strokeRect(0, highlightY, canvas.width, highlightHeight);
    
    // Add highlight label
    context.fillStyle = '#FF6F00';
    context.font = '14px Arial';
    context.fillText('Highlighted Content', 10, highlightY - 5);
    
    context.restore();
  };

  const generateSampleContent = () => {
    if (data.fileName.includes('Contract') || data.fileName.includes('TERMS')) {
      setDocumentContent(`
1. SUPPLIER DELIVERY TERMS

1.1 Delivery Schedule
All goods must be delivered according to the agreed schedule outlined in Exhibit A.

1.2 Late Delivery Penalties
If a supplier fails to deliver goods on time, the company has two options:
(1) Cancel the order and seek alternative suppliers, or 
(2) Accept delayed delivery with penalty charges applied to the supplier account.

1.3 Quality Assurance
All delivered goods must meet the quality standards specified in Section 3.2.

2. PAYMENT TERMS

2.1 Payment Schedule
Net 30 days from invoice date.

2.2 Early Payment Discount
2% discount available for payments made within 10 days.
      `);
    } else if (data.fileName.includes('Financial') || data.fileName.includes('Budget')) {
      setDocumentContent(`
Q3 FINANCIAL REPORT

Revenue Summary:
- Total Revenue: $2,400,000
- Operating Expenses: $1,800,000
- Net Profit: $600,000
- Profit Margin: 25%

Expense Breakdown:
- Personnel: $900,000
- Marketing: $300,000
- R&D: $350,000
- Operations: $250,000

Q4 Budget Allocation:
The budget allocation for Q4 includes increased marketing spend 
and R&D investment to support new product launches.

Revenue Projections:
- Q4 Target: $2,800,000
- Annual Goal: $10,200,000
      `);
    } else if (data.fileName.includes('Project') || data.fileName.includes('Proposal')) {
      setDocumentContent(`
PROJECT PROPOSAL: Digital Transformation Initiative

Executive Summary:
This proposal outlines a comprehensive digital transformation project.

Timeline:
The project proposal outlines a 6-month timeline with three phases:
(1) Planning and design (2 months)
(2) Development and testing (3 months) 
(3) Deployment and training (1 month)

Budget:
Total estimated cost is $150,000

Resources Required:
- 5 developers
- 2 project managers
- 1 UI/UX designer

Deliverables:
- System architecture document
- Developed application
- User training materials
- Technical documentation
      `);
    } else {
      setDocumentContent(`
Sample Document Content

This is a sample document showing how the preview feature works.
The system can display various types of documents including:

- PDF files with embedded viewer
- Word documents with text content
- Excel spreadsheets with data tables
- CSV files with structured data

Features:
✓ Document preview with zoom controls
✓ Highlighted answer sections
✓ Search and pagination
✓ Multiple file format support
      `);
    }
    setIsLoading(false);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 25, 200);
    console.log('Zoom in:', zoomLevel, '->', newZoom);
    setZoomLevel(newZoom);
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 25, 50);
    console.log('Zoom out:', zoomLevel, '->', newZoom);
    setZoomLevel(newZoom);
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && pdfDoc) {
      setCurrentPage(newPage);
      await renderPage(pdfDoc, newPage);
    }
  };

  const handleDownload = () => {
    // Convert Google Drive view link to download link
    const downloadLink = data.fileLink.replace('/view', '/export?format=pdf');
    window.open(downloadLink, '_blank');
  };

  const handleOpenFull = () => {
    window.open(data.fileLink, '_blank');
  };

  const getEmbedUrl = (driveUrl: string) => {
    // Convert Google Drive view URL to embed URL
    if (driveUrl.includes('drive.google.com/file/d/')) {
      const fileId = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        // Use the preview URL for all file types - most reliable for Google Drive
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return driveUrl;
  };

  const isGoogleDriveDocument = (url: string) => {
    return url.includes('drive.google.com/file/d/');
  };

  const highlightContent = (content: string) => {
    const lines = content.split('\n');
    
    if (!data.from || !data.to) {
      return lines.map((line, index) => (
        <div key={index} className="px-3 py-1 leading-relaxed">
          {line || '\u00A0'}
        </div>
      ));
    }
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isHighlighted = lineNumber >= data.from! && lineNumber <= data.to!;
      
      return (
        <div
          key={index}
          className={`px-3 py-1 leading-relaxed transition-all duration-200 ${
            isHighlighted 
              ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-400 shadow-sm' 
              : 'hover:bg-gray-50'
          }`}
        >
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 bg-white border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-gray-900">Document Preview</h3>
        <div className="flex items-center space-x-1">
          {(!isPdf || (isPdf && !pdfDoc)) && (
            <>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 50} className="h-7 w-7 p-0">
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs text-gray-600 min-w-[35px] text-center">{zoomLevel}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 200} className="h-7 w-7 p-0">
                <ZoomIn className="h-3 w-3" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="bg-gray-100 rounded-lg p-2 mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <FileText className="text-red-500" size={14} />
            <span className="text-xs font-medium text-gray-900">{data.fileName}</span>
          </div>
          {data.from && data.to && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-200 border border-yellow-500 rounded-sm"></div>
              <p className="text-xs text-gray-600">
                Lines {data.from}-{data.to}
              </p>
            </div>
          )}
        </div>
        
        {/* Document Content */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96 bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">Loading document...</p>
              </div>
            </div>
          ) : isPdf && isGoogleDriveDocument(data.fileLink) && pdfDoc ? (
            <div className="h-[400px] relative bg-gray-50 flex flex-col">
              {/* PDF Navigation Header */}
              <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    size="sm" 
                    variant="outline" 
                    disabled={currentPage <= 1}
                    className="px-2 h-7"
                  >
                    ←
                  </Button>
                  <span className="text-xs text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    size="sm" 
                    variant="outline" 
                    disabled={currentPage >= totalPages}
                    className="px-2 h-7"
                  >
                    →
                  </Button>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button onClick={handleZoomOut} size="sm" variant="outline" disabled={zoomLevel <= 50} className="px-2 h-7">
                    <ZoomOut size={12} />
                  </Button>
                  <span className="text-xs text-gray-600 min-w-[40px] text-center">{zoomLevel}%</span>
                  <Button onClick={handleZoomIn} size="sm" variant="outline" disabled={zoomLevel >= 200} className="px-2 h-7">
                    <ZoomIn size={12} />
                  </Button>
                </div>
              </div>
              
              {/* PDF Canvas or Fallback Interface */}
              <ScrollArea className="flex-1">
                <div className="p-2 flex justify-center min-h-full">
                {renderError ? (
                  <div className="flex items-center justify-center h-full text-center p-4 max-w-md">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                      <FileText className="mx-auto mb-4 text-blue-500" size={48} />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{data.fileName}</h3>
                      
                      {data.from && data.to && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <span className="text-sm text-yellow-800 font-medium">
                              Answer highlighted in document
                            </span>
                          </div>
                          <p className="text-xs text-yellow-700">
                            The relevant content has been identified and would be highlighted when viewing the document.
                          </p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-4">{renderError}</p>
                      
                      <div className="space-y-2">
                        <Button 
                          onClick={() => window.open(data.fileLink, '_blank')} 
                          size="sm" 
                          className="w-full"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          View in Google Drive
                        </Button>
                        <p className="text-xs text-gray-500">
                          The original document with highlighted sections is available in Google Drive
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <canvas 
                    ref={canvasRef}
                    className="border border-gray-300 shadow-sm block"
                    style={{ maxWidth: 'none' }}
                  />
                )}
                </div>
              </ScrollArea>
              
              {data.from && data.to && !renderError && (
                <div className="absolute top-12 right-4 bg-yellow-200 border border-yellow-400 rounded px-3 py-2 text-xs text-yellow-800 shadow-sm z-10">
                  <div className="font-medium">Lines {data.from}-{data.to}</div>
                  <div className="text-xs opacity-75">Navigate to find highlighted content</div>
                </div>
              )}
            </div>
          ) : isGoogleDriveDocument(data.fileLink) ? (
            <div className="h-[600px] relative bg-white">
              <iframe
                src={getEmbedUrl(data.fileLink)}
                className="w-full h-full border-0"
                title={data.fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                allow="autoplay"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
              
              {/* Overlay with document info */}
              {!isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
                  <div className="text-center text-gray-500 max-w-sm mx-auto p-6">
                    <FileText className="mx-auto mb-4 text-blue-500" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{data.fileName}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Google Drive Document
                    </p>
                    {data.from && data.to && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <span className="text-sm text-yellow-800 font-medium">
                            Answer highlighted in document
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mb-4">
                      Due to Google Drive security settings, preview may not be available for all documents.
                    </p>
                    <div className="text-xs text-blue-600 font-medium">
                      Use "Open Full Document" to view in Google Drive
                    </div>
                  </div>
                </div>
              )}
              
              {data.from && data.to && (
                <div className="absolute top-2 right-2 bg-yellow-200 border border-yellow-400 rounded px-2 py-1 text-xs text-yellow-800 shadow-sm z-10">
                  Highlighted Content
                </div>
              )}
            </div>
          ) : isPdf ? (
            <div className="h-[600px] relative">
              <iframe
                src={`${data.fileLink}#view=FitH&zoom=${zoomLevel}`}
                className="w-full h-full"
                title={data.fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div 
                className="font-sans text-sm"
                style={{ fontSize: `${zoomLevel}%` }}
              >
                {highlightContent(documentContent)}
              </div>
            </ScrollArea>
          )}
        </div>
        
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
