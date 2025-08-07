# WISSEN Document Chatbot

## Overview

This is a full-stack Document RAG + Web Search application that combines document-based retrieval-augmented generation with web search capabilities. Users can interact with AI agents that reference both uploaded documents and real-time web information. The system features a React frontend with shadcn/ui components and an Express.js backend that integrates with external N8N webhook services for document processing and enhanced AI responses.

## Recent Changes

### August 7, 2025
- **Sidebar Enhancement**: Removed hardcoded chat sections and replaced with dynamic session previews
- **Smart Chat History**: Sessions now display actual user message content instead of generic "Session" labels
- **Integrated Search Functionality**: Added working search bar at top of sidebar that filters through chat content
- **Header Design Update**: Centered page title with green accent line and improved button positioning
- **Content Preview System**: First user message from each chat appears as preview text with message count
- **Session Organization**: Chat sessions sorted by most recent activity for better user experience

### January 8, 2025
- **Enhanced Login Experience**: Added smooth loading transitions to eliminate white screen flash during login
- **Reactive Authentication System**: Implemented real-time session state checking without page reloads
- **Welcome Header Integration**: Added persistent welcome message in main app header with logout functionality
- **Loading Progress Indicator**: Created animated loading transition component with progress bar for better UX
- **Session Management Improvements**: Made authentication state responsive to sessionStorage changes

### January 8, 2025 (Earlier)
- **Full-Width Document Preview**: Changed document preview from fixed 900px width to flexible full-width layout (`flex-1`)
- **Enhanced Line Number Display**: Added specific line number references (e.g., "Lines 411-414") in both chat messages and document preview
- **Improved Highlighting Guidance**: Replaced generic "Highlighted Content" overlay with specific line numbers and navigation instructions
- **Fixed View Document Buttons**: Restored "Open Full Document" and "Download Document" buttons by reordering conditional rendering logic
- **PDF.js Zoom Controls**: Implemented working zoom controls (50%-200%) with debug logging for PDF canvas rendering
- **UI Simplification**: Removed documents section from sidebar, keeping only chat history since "View All Documents" option is available in main chat area
- **Google Drive Integration**: Updated document preview to properly handle Google Drive links with format `https://drive.google.com/file/d/{fileId}/view`
- **PDF.js Integration**: Implemented PDF.js library with backend proxy for direct PDF rendering from Google Drive links
- **Enhanced Document Preview**: Added PDF canvas rendering with zoom controls, page navigation, and visual highlighting overlays
- **Smart Fallback System**: Created elegant fallback interface when PDF rendering fails, showing document info and highlighting status
- **Backend PDF Proxy**: Implemented server-side proxy with multiple Google Drive URL strategies to bypass CORS restrictions
- **Improved UX**: Added proper loading states, timeout handling, and clear error messaging with fallback to Google Drive direct links

### January 7, 2025
- Added search and pagination functionality to Documents and History sections in the sidebar
- Implemented search bars with real-time filtering for both documents and chat sessions
- Added pagination controls with Previous/Next buttons and page indicators
- Enhanced document list modal with search and pagination capabilities
- Added fallback mock data for testing when N8N service is unavailable
- Set items per page to 5 for sidebar sections and 8 for document modal

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with custom configuration for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API endpoints
- **Development Server**: Custom Vite integration for seamless full-stack development
- **Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Memory-based chat session storage with UUID generation
- **Middleware**: Express middleware for JSON parsing, CORS handling, and request logging

### Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with migration support
- **Database Provider**: Neon Database (serverless PostgreSQL) for production
- **Schema Management**: Centralized schema definitions with Zod validation
- **Development Storage**: In-memory storage for development and testing

### External Service Integrations
- **N8N Webhooks**: Integration with external N8N workflows for document processing and AI chat responses
- **Document API**: POST endpoint to `http://localhost:5678/webhook/file-load-history` for retrieving document lists
- **Chat API**: POST endpoint to `http://localhost:5678/webhook/chatbot-api` for AI chat interactions with document context
- **PDF Processing**: Client-side PDF.js integration for document preview capabilities

### Key Architectural Decisions

**Monorepo Structure**: The application uses a shared codebase with client, server, and shared directories for type safety across the full stack.

**Type-Safe API Layer**: Shared TypeScript interfaces between frontend and backend ensure consistency and reduce runtime errors.

**Component-Based UI**: Modular React components with shadcn/ui for consistent design system and accessibility.

**Proxy Pattern for External APIs**: Backend acts as a proxy to N8N webhooks, providing error handling and data transformation.

**Session-Based Chat Management**: Chat sessions are managed with unique identifiers for conversation continuity and history tracking.

**Document Preview System**: Supports multiple file types (PDF, DOCX, XLSX, CSV) with appropriate preview mechanisms and fallback to external links.

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React routing
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **express**: Node.js web framework

### UI and Styling Dependencies
- **@radix-ui/react-***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library
- **cmdk**: Command palette component

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety and developer experience
- **@replit/vite-plugin-***: Replit-specific development tools
- **esbuild**: Fast bundling for production builds

### External Services
- **N8N Webhook Service** (localhost:5678): Document processing and AI chat backend
- **Neon Database**: Managed PostgreSQL database service
- **PDF.js**: Client-side PDF rendering and processing
- **Google Fonts**: Inter font family for typography