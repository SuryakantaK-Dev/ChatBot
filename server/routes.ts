import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, type Document, type ChatResponse } from "@shared/schema";
import { z } from "zod";

// Mock response generator for demonstration
function generateMockChatResponse(userInput: string): ChatResponse {
  const input = userInput.toLowerCase();
  
  // Sample document references for mock responses
  const sampleDocs = [
    { fileId: "1RKUniO9hI4611Q0G7_trPIMV3RSAAiLD", fileName: "US_TERMS_COND-0056.pdf", fileLink: "https://drive.google.com/file/d/1RKUniO9hI4611Q0G7_trPIMV3RSAAiLD/view" },
    { fileId: "2ABCdef789xyz", fileName: "Project_Proposal_2024.docx", fileLink: "https://drive.google.com/file/d/2ABCdef789xyz/view" },
    { fileId: "3XYZ123abc", fileName: "Financial_Report_Q3.xlsx", fileLink: "https://drive.google.com/file/d/3XYZ123abc/view" }
  ];
  
  if (input.includes("contract") || input.includes("terms") || input.includes("agreement")) {
    return {
      output: `\`\`\`json
{
  "answer": "According to the contract terms, if a supplier fails to deliver goods on time, the company has two options: (1) Cancel the order and seek alternative suppliers, or (2) Accept delayed delivery with penalty charges applied to the supplier account.",
  "FileID": "${sampleDocs[0].fileId}",
  "FileName": "${sampleDocs[0].fileName}",
  "FileLink": "${sampleDocs[0].fileLink}",
  "From": 411,
  "To": 414
}
\`\`\``
    };
  }
  
  if (input.includes("budget") || input.includes("financial") || input.includes("cost")) {
    return {
      output: `\`\`\`json
{
  "answer": "The Q3 financial report shows total revenue of $2.4M with operating expenses of $1.8M, resulting in a net profit margin of 25%. The budget allocation for Q4 includes increased marketing spend and R&D investment.",
  "FileID": "${sampleDocs[2].fileId}",
  "FileName": "${sampleDocs[2].fileName}",
  "FileLink": "${sampleDocs[2].fileLink}",
  "From": 89,
  "To": 95
}
\`\`\``
    };
  }
  
  if (input.includes("project") || input.includes("proposal") || input.includes("timeline")) {
    return {
      output: `\`\`\`json
{
  "answer": "The project proposal outlines a 6-month timeline with three phases: (1) Planning and design (2 months), (2) Development and testing (3 months), and (3) Deployment and training (1 month). Total estimated cost is $150,000.",
  "FileID": "${sampleDocs[1].fileId}",
  "FileName": "${sampleDocs[1].fileName}",
  "FileLink": "${sampleDocs[1].fileLink}",
  "From": 25,
  "To": 32
}
\`\`\``
    };
  }
  
  // Default response for general questions
  return {
    output: `I can help you find information from your uploaded documents. Try asking questions about contracts, financial reports, project proposals, or any specific topics mentioned in your documents. For example:

- "What are the contract terms for late delivery?"
- "What's our Q3 budget status?"
- "What's the project timeline?"

I'll search through your documents and provide relevant answers with source references.`
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // PDF proxy endpoint to handle Google Drive downloads and bypass CORS
  app.get("/api/proxy/pdf/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Try multiple Google Drive URLs in order of preference
      const urls = [
        `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
        `https://docs.google.com/document/d/${fileId}/export?format=pdf`,
        `https://drive.google.com/file/d/${fileId}/view`
      ];
      
      let response = null;
      let finalUrl = null;
      
      // Try each URL until we get a valid PDF
      for (const url of urls) {
        try {
          response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            redirect: 'follow'
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            // Check if we got a PDF
            if (contentType && contentType.includes('application/pdf')) {
              finalUrl = url;
              break;
            }
            
            // Check if it's a binary PDF (sometimes content-type isn't set correctly)
            const buffer = await response.arrayBuffer();
            const pdfHeader = new Uint8Array(buffer.slice(0, 4));
            const isPdf = pdfHeader[0] === 0x25 && pdfHeader[1] === 0x50 && 
                         pdfHeader[2] === 0x44 && pdfHeader[3] === 0x46; // %PDF
            
            if (isPdf) {
              // Set appropriate headers for PDF
              res.set({
                'Content-Type': 'application/pdf',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
              });
              return res.send(Buffer.from(buffer));
            }
          }
        } catch (urlError) {
          console.log(`Failed to fetch from ${url}:`, urlError);
          continue;
        }
      }
      
      // If no PDF found, return error
      return res.status(404).json({ 
        error: "PDF not found or not publicly accessible. The document may require Google account access or may not be a PDF file."
      });
      
    } catch (error) {
      console.error("PDF proxy error:", error);
      res.status(500).json({ error: "Failed to fetch PDF" });
    }
  });
  // Document list retrieval endpoint
  app.post("/api/documents", async (req, res) => {
    try {
      // Try to forward request to external webhook
      try {
        const response = await fetch("http://localhost:5678/webhook/file-load-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (response.ok) {
          const documents: Document[] = await response.json();
          return res.json(documents);
        }
      } catch (fetchError) {
        // Log but don't throw, fall back to mock data
        console.warn("External service unavailable, using mock data");
      }

      // Fallback mock data for testing pagination and search
      const mockDocuments: Document[] = [
        { name: "US_TERMS_COND-0056.pdf", link: "https://drive.google.com/file/d/1RKUniO9hI4611Q0G7_trPIMV3RSAAiLD/view" },
        { name: "Project_Proposal_2024.docx", link: "https://drive.google.com/file/d/2ABCdef789xyz/view" },
        { name: "Financial_Report_Q3.xlsx", link: "https://drive.google.com/file/d/3XYZ123abc/view" },
        { name: "Contract_Agreement.pdf", link: "https://drive.google.com/file/d/4DEF567ghi/view" },
        { name: "Technical_Specification.docx", link: "https://drive.google.com/file/d/5GHI890jkl/view" },
        { name: "Budget_Analysis.xlsx", link: "https://drive.google.com/file/d/6JKL123mno/view" },
        { name: "User_Manual.pdf", link: "https://drive.google.com/file/d/7MNO456pqr/view" },
        { name: "Meeting_Minutes.docx", link: "https://drive.google.com/file/d/8PQR789stu/view" },
        { name: "Sales_Data.csv", link: "https://example.com/doc9.csv" },
        { name: "Legal_Documentation.pdf", link: "https://example.com/doc10.pdf" },
        { name: "Marketing_Strategy.docx", link: "https://example.com/doc11.docx" },
        { name: "Inventory_Report.xlsx", link: "https://example.com/doc12.xlsx" },
        { name: "Training_Materials.pdf", link: "https://example.com/doc13.pdf" },
        { name: "Policy_Guidelines.docx", link: "https://example.com/doc14.docx" },
        { name: "Performance_Metrics.csv", link: "https://example.com/doc15.csv" }
      ];

      res.json(mockDocuments);
    } catch (error) {
      console.error("Error in documents endpoint:", error);
      res.status(500).json({ 
        error: "Failed to fetch documents",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Chat API endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { chatInput, sessionId } = req.body;
      
      if (!chatInput || !sessionId) {
        return res.status(400).json({ 
          error: "Missing required parameters",
          message: "Both chatInput and sessionId are required"
        });
      }

      // Save user message to storage
      await storage.saveChatMessage({
        session_id: sessionId,
        message: {
          type: 'human',
          content: chatInput,
          timestamp: Date.now()
        }
      });

      // Try to forward request to external chatbot API
      let chatResponse: ChatResponse;
      
      try {
        const apiUrl = `http://localhost:5678/webhook/chatbot-api?chatInput=${encodeURIComponent(chatInput)}&sessionId=${encodeURIComponent(sessionId)}`;
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (response.ok) {
          chatResponse = await response.json();
        } else {
          throw new Error(`Chatbot API error: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.warn("External chatbot service unavailable, using mock response");
        
        // Generate mock responses based on user input
        chatResponse = generateMockChatResponse(chatInput);
      }
      
      // Parse the output to extract structured response
      let aiMessage: any = {
        type: 'ai',
        content: chatResponse.output,
        timestamp: Date.now()
      };

      // Try to parse JSON from output if it contains structured data
      try {
        const jsonMatch = chatResponse.output.match(/```json\n(.*?)\n```/s);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[1]);
          if (parsedData.answer) {
            aiMessage = {
              type: 'ai',
              content: parsedData.answer,
              timestamp: Date.now(),
              documentReference: parsedData.FileID ? {
                fileId: parsedData.FileID,
                fileName: parsedData.FileName,
                fileLink: parsedData.FileLink,
                from: parsedData.From,
                to: parsedData.To
              } : undefined
            };
          }
        }
      } catch (parseError) {
        console.warn("Could not parse structured response:", parseError);
      }

      // Save AI response to storage
      await storage.saveChatMessage({
        session_id: sessionId,
        message: aiMessage
      });

      res.json(aiMessage);
    } catch (error) {
      console.error("Error in chat API:", error);
      res.status(500).json({ 
        error: "Chat request failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get chat history for a session
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ 
        error: "Failed to fetch chat history",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all chat sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllChatSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ 
        error: "Failed to fetch sessions",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete chat session
  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await storage.deleteChatSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ 
        error: "Failed to delete session",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
