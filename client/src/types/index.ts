export interface Document {
  link: string;
  name: string;
}

export interface ChatMessage {
  type: 'human' | 'ai';
  content: string;
  timestamp: number;
  documentReference?: {
    fileId: string;
    fileName: string;
    fileLink: string;
    from: number;
    to: number;
  };
  searchInfo?: string; // Information about web search results including URLs
}

export interface ChatSession {
  id: string;
  session_id: string;
  message: ChatMessage;
  created_at?: Date;
}

export interface DocumentPreviewData {
  fileName: string;
  fileLink: string;
  from?: number;
  to?: number;
}
