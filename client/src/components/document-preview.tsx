import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentPreviewData } from "@/types";
import { X, ExternalLink, Download, FileText, ZoomIn, ZoomOut } from "lucide-react";

interface DocumentPreviewProps {
  data: DocumentPreviewData;
  onClose: () => void;
}

export default function DocumentPreview({ data, onClose }: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [documentContent, setDocumentContent] = useState<string>("");

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const isPdf = getFileExtension(data.fileName) === 'pdf';
  const isDoc = ['docx', 'doc'].includes(getFileExtension(data.fileName));
  const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(getFileExtension(data.fileName));

  useEffect(() => {
    // Generate sample content for demonstration
    if (!isPdf) {
      generateSampleContent();
    }
  }, [data.fileName]);

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

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));

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
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    return driveUrl;
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
    <div className="w-[500px] bg-white border-l border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
        <div className="flex items-center space-x-2">
          {!isPdf && (
            <>
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 50}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600">{zoomLevel}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 200}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="text-red-500" size={16} />
            <span className="text-sm font-medium text-gray-900">{data.fileName}</span>
          </div>
          {data.from && data.to && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-200 border border-yellow-500 rounded-sm"></div>
              <p className="text-xs text-gray-600">
                Highlighted content shown below
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
          ) : data.fileLink.includes('drive.google.com') ? (
            <div className="h-96 relative bg-white">
              <iframe
                src={getEmbedUrl(data.fileLink)}
                className="w-full h-full border-0"
                title={data.fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                allow="autoplay"
              />
              {data.from && data.to && (
                <div className="absolute top-2 right-2 bg-yellow-200 border border-yellow-400 rounded px-2 py-1 text-xs text-yellow-800 shadow-sm">
                  Highlighted content: Lines {data.from}-{data.to}
                </div>
              )}
            </div>
          ) : isPdf ? (
            <div className="h-96 relative">
              <iframe
                src={`${data.fileLink}#view=FitH&zoom=${zoomLevel}`}
                className="w-full h-full"
                title={data.fileName}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          ) : (
            <ScrollArea className="h-96">
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
