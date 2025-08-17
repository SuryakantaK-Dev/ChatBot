import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertUserSchema, type Document, type ChatResponse } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

// Session middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'] as string;
  
  if (!sessionId) {
    return res.status(401).json({ message: 'Session required' });
  }
  
  const session = await storage.getUserSession(sessionId);
  if (!session) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
  
  const user = await storage.getUser(session.user_id);
  (req as any).user = user;
  (req as any).sessionId = sessionId;
  
  next();
};

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
  
  // Handle greetings and general questions
  if (input.includes("hello") || input.includes("hi") || input.includes("hey") || input.includes("good morning") || input.includes("good afternoon") || input.includes("good evening")) {
    return {
      output: `\`\`\`json
{
  "answer": "Hello! I'm your AI document assistant. I can help you search through your uploaded documents and answer questions about contracts, financial reports, project proposals, and more. What would you like to know?",
  "FileID": null,
  "FileName": null,
  "FileLink": null,
  "From": null,
  "To": null
}
\`\`\``
    };
  }
  
  // Handle help requests
  if (input.includes("help") || input.includes("what can you do") || input.includes("how do you work")) {
    return {
      output: `\`\`\`json
{
  "answer": "I can help you find information from your uploaded documents. Try asking specific questions like: 'What are the contract terms for late delivery?', 'What's our Q3 budget status?', 'What's the project timeline?', or 'Show me the financial report details.' I'll search through your documents and provide relevant answers with source references.",
  "FileID": null,
  "FileName": null,
  "FileLink": null,
  "From": null,
  "To": null
}
\`\`\``
    };
  }
  
  // Handle Tata Industries specific questions
  if (input.includes("tata") || input.includes("director") || input.includes("board")) {
    return {
      output: `\`\`\`json
{
  "answer": "Based on the Tata Industries board documentation, the key directors include Mr. Ratan Tata (Chairman), Mr. Natarajan Chandrasekaran (CEO), and Ms. Aarthi Sivanandh (CFO). The board structure includes 12 members with diverse expertise in technology, finance, and operations.",
  "FileID": "TATA_BOARD_2024",
  "FileName": "Tata_Industries_Board_Structure.pdf",
  "FileLink": "https://drive.google.com/file/d/TATA_BOARD_2024/view",
  "From": 15,
  "To": 28
}
\`\`\``
    };
  }
  
  // Handle web search requests
  if (input.includes("web search") || input.includes("search the web") || input.includes("google") || input.includes("internet")) {
    return {
      output: `\`\`\`json
{
  "answer": "Here are the results from my web search:\n\n1. **Example.com** - This is a placeholder website used for illustrative examples in documents.\n2. **Sample.org** - Another placeholder domain commonly used in documentation.\n\nWould you like me to search for something specific?",
  "FileID": "WebSearch",
  "FileName": "Web Search Results",
  "FileLink": "https://www.google.com",
  "From": 0,
  "To": 0,
  "searchInfo": "https://example.com - Example Domain\nhttps://sample.org - Sample Organization"
}
\`\`\``
    };
  }
  
  // Default response for general questions - always return JSON format
  return {
    output: `\`\`\`json
{
  "answer": "Hello! I'm your document assistant. I can help you find information from your uploaded documents. Try asking specific questions about contracts, financial reports, project proposals, or any topics mentioned in your documents. For example: 'What are the contract terms for late delivery?' or 'What's our Q3 budget status?'",
  "FileID": null,
  "FileName": null,
  "FileLink": null,
  "From": null,
  "To": null
}
\`\`\``
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = insertUserSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(loginData.username);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password" 
        });
      }
      
      // Check password (in production, use proper password hashing)
      if (user.password !== loginData.password) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password" 
        });
      }
      
      // Create session
      const sessionId = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session
      
      await storage.createUserSession({
        user_id: user.id,
        session_id: sessionId,
        expires_at: expiresAt
      });
      
      res.json({
        success: true,
        message: "Login successful",
        sessionId,
        user: {
          username: user.username
        }
      });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Login failed" 
      });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteUserSession(req.sessionId);
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ success: false, message: "Logout failed" });
    }
  });

  // PDF proxy endpoint to handle Google Drive downloads and bypass CORS
  app.get("/api/proxy/pdf/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Try multiple Google Drive URLs in order of preference
      const urls = [
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
        `https://docs.google.com/document/d/${fileId}/export?format=pdf`
      ];
      
      let response = null;
      let finalUrl = null;
      
      // Try each URL until we get a valid PDF
      for (const url of urls) {
        try {
          response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
          });
          
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            
            // Check if it's a binary PDF by examining the header
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
                'Content-Length': buffer.byteLength.toString(),
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
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
        
        console.log(`[DEBUG] Attempting to call external API: ${apiUrl}`);
        console.log(`[DEBUG] Request payload:`, { chatInput, sessionId });
        
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout for N8N service
        });

        console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);
        console.log(`[DEBUG] Response headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const responseText = await response.text();
          console.log(`[DEBUG] Response body:`, responseText);
          
          try {
            chatResponse = JSON.parse(responseText);
            console.log(`[DEBUG] Parsed response:`, chatResponse);
          } catch (parseError) {
            console.error(`[ERROR] Failed to parse JSON response:`, parseError);
            throw new Error(`Invalid JSON response from chatbot API`);
          }
        } else {
          const errorText = await response.text();
          console.error(`[ERROR] Chatbot API error: ${response.status} ${response.statusText}`);
          console.error(`[ERROR] Error response body:`, errorText);
          throw new Error(`Chatbot API error: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError) {
        console.error(`[ERROR] Failed to call external chatbot service:`, fetchError);
        console.warn("[WARN] External chatbot service unavailable, using mock response");
        
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
        let parsedData = null;
        
        // First, try to parse the response as direct JSON
        try {
          parsedData = JSON.parse(chatResponse.output);
          console.log("[DEBUG] Direct JSON parse successful:", parsedData);
        } catch (directParseError) {
          console.log("[DEBUG] Direct JSON parse failed, trying markdown code blocks");
          console.log("[DEBUG] Raw output to parse:", chatResponse.output);
          console.log("[DEBUG] Output length:", chatResponse.output.length);
          
          // If direct parsing fails, try to extract JSON from markdown code blocks
          // Updated regex to handle both ```json and ``` formats with flexible whitespace
          // Also handle cases where there might be 4 backticks at the end
          const jsonMatch = chatResponse.output.match(/```(?:json)?\s*([\s\S]*?)\s*```+/);
          console.log("[DEBUG] Regex match result:", jsonMatch);
          if (jsonMatch) {
            console.log("[DEBUG] Found JSON in markdown code block");
            try {
              // Clean the extracted JSON string before parsing
              let cleanJsonString = jsonMatch[1].trim();
              
              // More aggressive cleaning for problematic characters
              cleanJsonString = cleanJsonString
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove all control chars except \t, \n, \r
                .replace(/\r\n/g, '\n') // Normalize line endings
                .replace(/\r/g, '\n') // Normalize line endings
                .replace(/\t/g, ' ') // Replace tabs with spaces
                .replace(/\n\s*\n/g, '\n') // Remove empty lines
                .replace(/\s+/g, ' ') // Normalize multiple spaces
                .trim(); // Final trim
              
              console.log("[DEBUG] Cleaned JSON string:", cleanJsonString);
              
              parsedData = JSON.parse(cleanJsonString);
              console.log("[DEBUG] Markdown JSON parse successful:", parsedData);
            } catch (jsonParseError) {
              console.error("[ERROR] Failed to parse extracted JSON:", jsonParseError);
              console.error("[DEBUG] Raw extracted string:", jsonMatch[1]);
              // Don't set parsedData, let it fall through to error handling
            }
          } else {
            console.log("[DEBUG] No JSON found in markdown code blocks");
          }
        }
        
        if (parsedData && parsedData.answer) {
          // Clean up markdown formatting for better display but preserve important bold values
          let cleanAnswer = parsedData.answer
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/```(.*?)```/g, '$1') // Remove code blocks  
            .replace(/`(.*?)`/g, '$1'); // Remove inline code
          // Note: We keep **bold** formatting intact for values like **$60,000** and section headers
          
          console.log("[DEBUG] searchInfo in parsedData:", parsedData.searchInfo);
          
          aiMessage = {
            type: 'ai',
            content: cleanAnswer,
            timestamp: Date.now(),
            documentReference: parsedData.FileID && parsedData.FileID !== "Not Applicable" ? {
              fileId: parsedData.FileID,
              fileName: parsedData.FileName,
              fileLink: parsedData.FileLink,
              from: parsedData.From,
              to: parsedData.To
            } : undefined,
            searchInfo: parsedData.searchInfo // Pass searchInfo to client if it exists
          };
          
          // Ensure searchInfo is properly formatted as a string
          if (aiMessage.searchInfo && typeof aiMessage.searchInfo !== 'string') {
            aiMessage.searchInfo = JSON.stringify(aiMessage.searchInfo);
          }
          
          console.log("[DEBUG] Final aiMessage with searchInfo:", aiMessage);
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

  // Test endpoint to check if external chatbot service is reachable
  app.get("/api/test-chatbot-service", async (req, res) => {
    try {
      console.log("[DEBUG] Testing connection to external chatbot service...");
      
      const testUrl = "http://localhost:5678/webhook/chatbot-api";
      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: "test",
          sessionId: "test-session"
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout for testing
      });

      console.log(`[DEBUG] Test response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`[DEBUG] Test response body:`, responseText);
        
        res.json({
          status: "success",
          message: "External chatbot service is reachable",
          responseStatus: response.status,
          responseBody: responseText
        });
      } else {
        const errorText = await response.text();
        res.status(502).json({
          status: "error",
          message: "External chatbot service returned error",
          responseStatus: response.status,
          responseStatusText: response.statusText,
          errorBody: errorText
        });
      }
    } catch (error) {
      console.error("[ERROR] Test failed:", error);
      res.status(503).json({
        status: "error",
        message: "External chatbot service is not reachable",
        error: error instanceof Error ? error.message : "Unknown error"
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
