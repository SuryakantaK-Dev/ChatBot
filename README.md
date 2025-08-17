# 🤖 AI Chatbot with Document Preview

A sophisticated AI-powered chatbot application that can search through documents, answer questions, and provide interactive document previews with highlighting capabilities.

## ✨ Features

### 🧠 AI Chatbot
- **Intelligent Q&A**: Ask questions about your documents and get AI-powered answers
- **Document Search**: RAG (Retrieval-Augmented Generation) for accurate responses
- **Web Search Integration**: Fallback to web search when document context is insufficient
- **Session Management**: Persistent chat sessions with history

### 📄 Document Preview System
- **Multi-Format Support**: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.ppt)
- **Google Drive Integration**: Seamless preview of cloud-stored documents
- **Smart Fallbacks**: Multiple preview strategies for different file types
- **Highlighting**: Visual highlighting of relevant document sections
- **Zoom & Navigation**: Full PDF navigation with page controls

### 🔧 Technical Features
- **TypeScript**: Full type safety and modern development experience
- **React Frontend**: Modern, responsive UI with Tailwind CSS
- **Express Backend**: Robust API with proper error handling
- **n8n Integration**: Workflow automation for AI processing
- **Real-time Updates**: Live chat with immediate responses

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- n8n instance running
- Google Drive API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/chatbot-app.git
   cd chatbot-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   # - n8n webhook URLs
   # - Google Drive API keys
   # - Database connection strings
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

## 🏗️ Architecture

```
chatbot-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # API clients
│   │   └── types/         # TypeScript definitions
│   └── public/            # Static assets
├── server/                 # Express.js backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Data persistence
│   └── index.ts           # Server entry point
├── shared/                 # Shared utilities
│   └── schema.ts          # Database schemas
└── n8n/                   # Workflow definitions
    └── My workflow 20.json
```

## 🔌 API Endpoints

- `POST /api/chat` - Send chat messages
- `GET /api/chat/:sessionId` - Get chat history
- `GET /api/documents` - List available documents
- `GET /api/proxy/pdf/:fileId` - PDF proxy for Google Drive
- `POST /webhook/chatbot-api` - n8n webhook integration

## 📱 Usage

### Chat Interface
1. **Start a session** by entering your name
2. **Ask questions** about your documents
3. **View answers** with document references
4. **Click document links** to preview content

### Document Preview
1. **Click "View Documents"** from chat responses
2. **Browse document list** with search and filters
3. **Preview documents** with highlighting
4. **Navigate pages** and adjust zoom levels

## 🛠️ Configuration

### n8n Workflow
The chatbot integrates with n8n workflows for:
- **RAG Processing**: Document search and context retrieval
- **AI Generation**: LLM-powered answer generation
- **Web Search**: Fallback information gathering

### Google Drive
- **API Integration**: Direct access to document storage
- **Preview URLs**: Optimized for different file types
- **Permission Handling**: Secure access controls

## 🧪 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Structure
- **Components**: Reusable UI components with TypeScript
- **Hooks**: Custom React hooks for state management
- **API Layer**: Centralized API client with error handling
- **State Management**: React Query for server state

## 🐛 Troubleshooting

### Common Issues
1. **JSON Parsing Errors**: Check n8n workflow output format
2. **Document Preview Issues**: Verify Google Drive permissions
3. **Chatbot Not Responding**: Check n8n webhook connectivity
4. **Build Errors**: Ensure all dependencies are installed

### Debug Mode
Enable detailed logging by setting `DEBUG=true` in your environment variables.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section
- Review the n8n workflow configuration

---

**Built with ❤️ using modern web technologies**
