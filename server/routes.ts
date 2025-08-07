import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, type Document, type ChatResponse } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
        { name: "US_TERMS_COND-0056.pdf", link: "https://example.com/doc1.pdf" },
        { name: "Project_Proposal_2024.docx", link: "https://example.com/doc2.docx" },
        { name: "Financial_Report_Q3.xlsx", link: "https://example.com/doc3.xlsx" },
        { name: "Contract_Agreement.pdf", link: "https://example.com/doc4.pdf" },
        { name: "Technical_Specification.docx", link: "https://example.com/doc5.docx" },
        { name: "Budget_Analysis.xlsx", link: "https://example.com/doc6.xlsx" },
        { name: "User_Manual.pdf", link: "https://example.com/doc7.pdf" },
        { name: "Meeting_Minutes.docx", link: "https://example.com/doc8.docx" },
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

      // Forward request to external chatbot API
      const apiUrl = `http://localhost:5678/webhook/chatbot-api?chatInput=${encodeURIComponent(chatInput)}&sessionId=${encodeURIComponent(sessionId)}`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Chatbot API error: ${response.statusText}`);
      }

      const chatResponse: ChatResponse = await response.json();
      
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
