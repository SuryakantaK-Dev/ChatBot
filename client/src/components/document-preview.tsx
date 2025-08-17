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

  // Effect to render PDF page when both PDF and canvas are ready
  useEffect(() => {
    const renderInitialPage = async () => {
      if (pdfDoc && canvasRef.current && currentPage && !renderError) {
        console.log('Both PDF and canvas ready, rendering page:', currentPage);
        await renderPage(pdfDoc, currentPage);
        console.log('Page rendered successfully!');
      }
    };
    
    renderInitialPage();
  }, [pdfDoc, currentPage, zoomLevel, renderError]);

  // Load and render Google Drive PDF using PDF.js via backend proxy
  const loadGoogleDrivePDF = async () => {
    try {
      const fileId = data.fileLink.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (!fileId) {
        throw new Error("Invalid Google Drive URL");
      }

      setRenderError("");
      
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
      setCurrentPage(1);
      
      // Don't render immediately - let useEffect handle it when canvas is ready
      console.log('PDF loaded, waiting for canvas to be ready...');
      setIsLoading(false);
    } catch (error) {
      console.error("PDF loading error:", error);
      // Show a helpful fallback interface instead of PDF rendering
      setRenderError("PDF preview is not available for this Google Drive document. This is typically due to document privacy settings or authentication requirements.");
      setIsLoading(false);
    }
  };

  // Function removed - now using visual PDF rendering with pagination

  // Render a specific page of the PDF
  const renderPage = async (pdf: any, pageNum: number) => {
    if (!canvasRef.current) {
      console.log('Canvas not ready yet, skipping render');
      return;
    }

    try {
      console.log(`Rendering PDF page ${pageNum} at zoom ${zoomLevel}%`);
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.log('Canvas context not available');
        return;
      }

      const viewport = page.getViewport({ scale: zoomLevel / 100 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Clear canvas first
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      console.log(`Page ${pageNum} rendered successfully`);

      // Add highlighting overlay if this document has highlighted sections
      if (data.from && data.to) {
        await addHighlightOverlay(context, viewport, canvas, page);
        console.log(`Highlighting applied for lines ${data.from}-${data.to}`);
      }
    } catch (error) {
      console.error("Page rendering error:", error);
    }
  };

  // Add highlight overlay for specific lines from API (e.g., 411-414)
  const addHighlightOverlay = async (context: CanvasRenderingContext2D, viewport: any, canvas: HTMLCanvasElement, page: any) => {
    if (!data.from || !data.to) return;
    
    try {
      // Extract text content to find line positions
      const textContent = await page.getTextContent();
      const textItems = textContent.items;
      
      // Calculate approximate line positions based on text items
      const lineHeight = 16; // Approximate line height in PDF units
      const linesPerPage = Math.floor(viewport.height / lineHeight);
      
      // Calculate which lines to highlight (API provides line numbers like 411-414)
      const startLine = data.from;
      const endLine = data.to;
      
      // Estimate which page these lines might be on
      const pageStartLine = (currentPage - 1) * linesPerPage + 1;
      const pageEndLine = currentPage * linesPerPage;
      
      // If the highlighted lines are likely on this page
      if (startLine <= pageEndLine && endLine >= pageStartLine) {
        context.save();
        context.fillStyle = 'rgba(255, 235, 59, 0.4)'; // Bright yellow highlight
        context.strokeStyle = '#FFC107';
        context.lineWidth = 3;
        
        // Calculate highlight position - more prominent highlighting
        const relativeStartLine = Math.max(1, startLine - pageStartLine + 1);
        const relativeEndLine = Math.min(linesPerPage, endLine - pageStartLine + 1);
        
        const highlightY = Math.max(50, (relativeStartLine - 1) * lineHeight);
        const highlightHeight = Math.max(40, (relativeEndLine - relativeStartLine + 1) * lineHeight);
        
        // Add prominent highlight rectangle
        context.fillRect(40, highlightY, canvas.width - 80, highlightHeight);
        context.strokeRect(40, highlightY, canvas.width - 80, highlightHeight);
        
        // Add prominent label
        context.fillStyle = '#FF6F00';
        context.font = 'bold 14px Arial';
        context.fillText(`📍 Lines ${startLine}-${endLine}`, 50, Math.max(30, highlightY - 8));
        
        context.restore();
      } else {
        // Show indicator that highlights are on another page
        context.save();
        context.fillStyle = 'rgba(255, 193, 7, 0.2)';
        context.fillRect(0, 0, canvas.width, 40);
        context.fillStyle = '#FF6F00';
        context.font = 'bold 12px Arial';
        context.fillText(`📍 Lines ${startLine}-${endLine} highlighted on page ${Math.ceil(startLine / linesPerPage)}`, 10, 25);
        context.restore();
      }
    } catch (error) {
      console.error('Error adding highlight overlay:', error);
      // Fallback to simple prominent highlight
      context.save();
      context.fillStyle = 'rgba(255, 235, 59, 0.4)';
      context.strokeStyle = '#FFC107';
      context.lineWidth = 3;
      const highlightHeight = canvas.height * 0.15;
      const highlightY = canvas.height * 0.4;
      context.fillRect(20, highlightY, canvas.width - 40, highlightHeight);
      context.strokeRect(20, highlightY, canvas.width - 40, highlightHeight);
      context.fillStyle = '#FF6F00';
      context.font = 'bold 14px Arial';
      context.fillText(`📍 Lines ${data.from}-${data.to}`, 30, highlightY - 10);
      context.restore();
    }
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

  const isWebSearchResult = (fileId: string) => {
    return fileId === "WebSearch" || fileId === "NoFileID";
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
    <div className="bg-white h-full overflow-hidden flex flex-col shadow-2xl">
      {/* Header with Close Button - Enhanced for overlay */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900 ml-4">
            {isWebSearchResult(data.fileId) ? "Web Search Results" : "Document Preview"}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {(!isPdf || (isPdf && !pdfDoc)) && (
            <>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 50} className="h-9 w-9 p-0">
                <ZoomOut className="h-5 w-5" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[45px] text-center font-medium">{zoomLevel}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 200} className="h-9 w-9 p-0">
                <ZoomIn className="h-5 w-5" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 ml-2 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">        
        {/* Document Content - Scrollable - Now Full Height */}
        <div className="flex-1 overflow-hidden">
          <div className="bg-white overflow-hidden h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm">Loading document...</p>
                </div>
              </div>
            ) : isPdf && isGoogleDriveDocument(data.fileLink) && pdfDoc ? (
              <div className="h-full relative bg-gray-50 flex flex-col">
                {/* PDF Navigation Header - Enhanced */}
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b flex-shrink-0 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      size="sm" 
                      variant="outline" 
                      disabled={currentPage <= 1}
                      className="px-3 h-8 font-medium"
                    >
                      ← Prev
                    </Button>
                    <span className="text-sm text-gray-700 font-semibold bg-white px-3 py-1 rounded border">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      size="sm" 
                      variant="outline" 
                      disabled={currentPage >= totalPages}
                      className="px-3 h-8 font-medium"
                    >
                      Next →
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button onClick={handleZoomOut} size="sm" variant="outline" disabled={zoomLevel <= 50} className="px-3 h-8">
                      <ZoomOut size={14} />
                    </Button>
                    <span className="text-sm text-gray-700 min-w-[50px] text-center font-semibold bg-white px-2 py-1 rounded border">{zoomLevel}%</span>
                    <Button onClick={handleZoomIn} size="sm" variant="outline" disabled={zoomLevel >= 200} className="px-3 h-8">
                      <ZoomIn size={14} />
                    </Button>
                  </div>
                </div>
                
                {/* PDF Canvas Display */}
                <ScrollArea className="flex-1">
                  <div className="p-4 flex justify-center">
                    {renderError ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-w-md">
                          <FileText className="mx-auto mb-4 text-blue-500" size={48} />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">{data.fileName}</h3>
                          
                          {data.from && data.to && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                <span className="text-sm text-yellow-800 font-medium">
                                  Lines {data.from}-{data.to} highlighted
                                </span>
                              </div>
                              <p className="text-xs text-yellow-700">
                                The relevant content would be highlighted when viewing the document.
                              </p>
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-600 mb-4">{renderError}</p>
                          
                          <Button 
                            onClick={() => window.open(data.fileLink, '_blank')} 
                            size="sm" 
                            className="w-full"
                          >
                            <ExternalLink size={14} className="mr-1" />
                            View in Google Drive
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <canvas 
                        ref={canvasRef}
                        className="border border-gray-300 shadow-lg rounded"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    )}
                  </div>
                </ScrollArea>
                
                {/* Highlight Indicator - Enhanced */}
                {data.from && data.to && !renderError && (
                  <div className="absolute top-20 right-6 bg-yellow-300 border-2 border-yellow-500 rounded-lg px-4 py-3 text-sm text-yellow-900 shadow-lg z-10 animate-pulse">
                    <div className="font-bold flex items-center space-x-2">
                      <span>🎯</span>
                      <span>Lines {data.from}-{data.to}</span>
                    </div>
                    <div className="text-xs opacity-80 mt-1">Highlighted in bright yellow</div>
                  </div>
                )}
              </div>
            ) : isWebSearchResult(data.fileId) ? (
              <div className="h-full relative bg-white">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-600 max-w-md mx-auto p-8">
                    <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Web Search Results</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      This information was found through web search. Click the button below to view the search results.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-sm text-blue-800 font-medium">
                          Web Search Source
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Information gathered from multiple web sources for accuracy.
                      </p>
                    </div>
                    <Button 
                      onClick={() => window.open(data.fileLink, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                    >
                      <ExternalLink className="mr-2 h-5 w-5" />
                      View Web Search Results
                    </Button>
                  </div>
                </div>
              </div>
            ) : isGoogleDriveDocument(data.fileLink) ? (
              <div className="h-full relative bg-white">
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
              <div className="h-full relative">
                <iframe
                  src={`${data.fileLink}#view=FitH&zoom=${zoomLevel}`}
                  className="w-full h-full"
                  title={data.fileName}
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div 
                  className="font-sans text-sm"
                  style={{ fontSize: `${zoomLevel}%` }}
                >
                  {highlightContent(documentContent)}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
        
      {/* Action Buttons - Enhanced for overlay */}
      <div className="p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50">
        <div className="flex space-x-4">
          {isWebSearchResult(data.fileId) ? (
            <Button 
              onClick={() => window.open(data.fileLink, '_blank')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium shadow-md"
            >
              <ExternalLink className="mr-3 h-5 w-5" />
              View Web Search Results
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleOpenFull}
                className="flex-1 bg-primary hover:bg-primary-dark text-white h-12 text-base font-medium shadow-md"
              >
                <ExternalLink className="mr-3 h-5 w-5" />
                Open Full Document
              </Button>
              <Button 
                onClick={handleDownload}
                variant="secondary"
                className="flex-1 h-12 text-base font-medium shadow-md"
              >
                <Download className="mr-3 h-5 w-5" />
                Download Document
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}