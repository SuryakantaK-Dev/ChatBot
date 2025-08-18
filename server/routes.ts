import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertUserSchema, type Document, type ChatResponse } from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

// Configuration for API timeouts and retries
const API_CONFIG = {
  TIMEOUT_MS: 90000,        // 90 seconds timeout for external API calls
  MAX_RETRIES: 2,           // Maximum number of retry attempts
  RETRY_DELAY_BASE_MS: 1000 // Base delay for exponential backoff (1s, 2s, 4s...)
};

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

// Format chatbot responses for better UI presentation
function formatChatbotResponse(answer: string): string {
  // Remove markdown code blocks and inline code
  let cleanAnswer = answer
    .replace(/```(.*?)```/g, '$1') // Remove code blocks
    .replace(/`(.*?)`/g, '$1'); // Remove inline code
  
  // Keep bold formatting but remove italics
  cleanAnswer = cleanAnswer.replace(/\*(.*?)\*/g, '$1');
  
  // Transform the response into a more structured format
  const lines = cleanAnswer.split('\n').filter(line => line.trim());
  
  // Check if it's already well-structured
  if (lines.length <= 2) {
    // Simple response, just clean it up
    return cleanAnswer.trim();
  }
  
  // Look for patterns that suggest structured content
  const hasBulletPoints = lines.some(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
  const hasNumberedList = lines.some(line => /^\d+\./.test(line.trim()));
  const hasKeyValuePairs = lines.some(line => line.includes(':') && line.includes('**'));
  
  if (hasBulletPoints || hasNumberedList) {
    // Already structured, just clean up
    return cleanAnswer.trim();
  }
  
  if (hasKeyValuePairs) {
    // Transform key-value pairs into bullet points
    const formattedLines = lines.map(line => {
      if (line.includes(':') && line.includes('**')) {
        return `• ${line.trim()}`;
      }
      return line.trim();
    });
    return formattedLines.join('\n');
  }
  
  // Look for natural sentence breaks to create structure
  const sentences = cleanAnswer.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length > 2) {
    // Create bullet points from sentences
    const bulletPoints = sentences.map(sentence => {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length > 0) {
        return `• ${cleanSentence}`;
      }
      return '';
    }).filter(point => point.length > 0);
    
    return bulletPoints.join('\n');
  }
  
  // Enhanced formatting for financial data and key metrics
  if (cleanAnswer.includes('₹') || cleanAnswer.includes('$') || cleanAnswer.includes('%')) {
    // Format financial responses with better structure
    const financialLines = cleanAnswer.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (financialLines.length > 1) {
      // Add a summary header for financial responses
      let formattedFinancial = ['**📊 Financial Summary**'];
      
      formattedFinancial = formattedFinancial.concat(financialLines.map(line => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          // Highlight key numbers and metrics
          const highlighted = trimmed
            .replace(/(₹[\d,]+\.?\d*)/g, '**$1**')
            .replace(/(\$[\d,]+\.?\d*)/g, '**$1**')
            .replace(/(\d+%)/g, '**$1**');
          return `• ${highlighted}`;
        }
        return '';
      }).filter(line => line.length > 0));
      
      return formattedFinancial.join('\n');
    }
  }
  
  // Special formatting for company/board information
  if (cleanAnswer.toLowerCase().includes('director') || cleanAnswer.toLowerCase().includes('board') || cleanAnswer.toLowerCase().includes('ceo')) {
    const companyLines = cleanAnswer.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (companyLines.length > 1) {
      let formattedCompany = ['**👥 Company Leadership**'];
      
      formattedCompany = formattedCompany.concat(companyLines.map(line => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          // Highlight names and titles
          const highlighted = trimmed
            .replace(/(Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-z]+)/g, '**$1 $2**')
            .replace(/(CEO|CFO|Chairman|Director)/g, '**$1**');
          return `• ${highlighted}`;
        }
        return '';
      }).filter(line => line.length > 0));
      
      return formattedCompany.join('\n');
    }
  }
  
  // Special formatting for project/timeline information
  if (cleanAnswer.toLowerCase().includes('project') || cleanAnswer.toLowerCase().includes('timeline') || cleanAnswer.toLowerCase().includes('phase')) {
    const projectLines = cleanAnswer.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (projectLines.length > 1) {
      let formattedProject = ['**📅 Project Timeline**'];
      
      formattedProject = formattedProject.concat(projectLines.map(line => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          // Highlight phases and timeframes
          const highlighted = trimmed
            .replace(/(\d+)\s*(month|week|day)/g, '**$1 $2**')
            .replace(/(Phase|Planning|Development|Testing|Deployment)/g, '**$1**');
          return `• ${highlighted}`;
        }
        return '';
      }).filter(line => line.length > 0));
      
      return formattedProject.join('\n');
    }
  }
  
  // Default: return cleaned answer
  return cleanAnswer.trim();
}

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
      let chatResponse: ChatResponse | null = null;
      
             try {
         const apiUrl = `http://localhost:5678/webhook/chatbot-api?chatInput=${encodeURIComponent(chatInput)}&sessionId=${encodeURIComponent(sessionId)}`;
         
         console.log(`[DEBUG] Attempting to call external API: ${apiUrl}`);
         console.log(`[DEBUG] Request payload:`, { chatInput, sessionId });
         
                  // Retry logic with exponential backoff
         let lastError: any = null;
         
         for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
           try {
                            console.log(`[DEBUG] Attempt ${attempt}/${API_CONFIG.MAX_RETRIES} to call external API`);
             
             const response = await fetch(apiUrl, {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
               },
               signal: AbortSignal.timeout(API_CONFIG.TIMEOUT_MS) // Configurable timeout for external API calls
             });

             console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);
             console.log(`[DEBUG] Response headers:`, Object.fromEntries(response.headers.entries()));

             if (response.ok) {
               const responseText = await response.text();
               console.log(`[DEBUG] Response body:`, responseText);
               
               try {
                 const parsedResponse = JSON.parse(responseText);
                 console.log(`[DEBUG] Parsed response:`, parsedResponse);
                 
                 // Handle different response formats
                 if (parsedResponse.output) {
                   if (typeof parsedResponse.output === 'string') {
                     // Case 1: output is a JSON string that needs parsing
                     try {
                       // First, try to extract JSON from markdown code blocks if present
                       let jsonString = parsedResponse.output;
                       
                       // Check if it's wrapped in markdown code blocks
                       const codeBlockMatch = parsedResponse.output.match(/```(?:json)?\s*([\s\S]*?)```/);
                       if (codeBlockMatch) {
                         jsonString = codeBlockMatch[1]; // Extract content inside code blocks
                         console.log(`[DEBUG] Extracted JSON from markdown code blocks:`, jsonString);
                       }
                       
                       // Clean the string to handle newlines and formatting issues
                       let cleanString = jsonString
                         .replace(/\n/g, ' ')           // Replace newlines with spaces
                         .replace(/\r/g, ' ')           // Replace carriage returns with spaces
                         .replace(/\t/g, ' ')           // Replace tabs with spaces
                         .replace(/\s+/g, ' ')          // Normalize multiple spaces
                         .trim();                       // Trim whitespace
                       
                       const outputData = JSON.parse(cleanString);
                       chatResponse = { output: outputData };
                       console.log(`[DEBUG] Successfully parsed output field from string:`, outputData);
                     } catch (outputParseError) {
                       // Case 2: output is a plain string, not JSON
                       chatResponse = { output: parsedResponse.output };
                       console.log(`[DEBUG] Output is plain string, using as is:`, parsedResponse.output);
                     }
                   } else if (typeof parsedResponse.output === 'object') {
                     // Case 3: output is already a parsed object
                     chatResponse = { output: parsedResponse.output };
                     console.log(`[DEBUG] Output is already parsed object:`, parsedResponse.output);
                   }
                 } else if (parsedResponse.answer) {
                   // Case 4: response has answer field directly
                   chatResponse = { output: parsedResponse };
                   console.log(`[DEBUG] Response has answer field directly:`, parsedResponse);
                 } else {
                   // Case 5: unknown format, try to use as is
                   chatResponse = { output: parsedResponse };
                   console.log(`[DEBUG] Unknown format, using response as is:`, parsedResponse);
                 }
               } catch (parseError) {
                 console.error(`[ERROR] Failed to parse JSON response:`, parseError);
                 throw new Error(`Invalid JSON response from chatbot API`);
               }
               
               // If we get here, the request was successful, break out of retry loop
               break;
               
                            } else {
                 const errorText = await response.text();
                 console.error(`[ERROR] Chatbot API error: ${response.status} ${response.statusText}`);
                 console.error(`[ERROR] Error response body:`, errorText);
                 throw new Error(`Chatbot API error: ${response.status} ${response.statusText}`);
               }
             } catch (attemptError) {
               lastError = attemptError;
               console.error(`[ERROR] Attempt ${attempt} failed:`, attemptError);
               
               if (attempt < API_CONFIG.MAX_RETRIES) {
                 // Wait before retrying (exponential backoff)
                 const waitTime = Math.pow(2, attempt) * API_CONFIG.RETRY_DELAY_BASE_MS; // 1s, 2s
                 console.log(`[DEBUG] Waiting ${waitTime}ms before retry...`);
                 await new Promise(resolve => setTimeout(resolve, waitTime));
               }
             }
           }
           
           // If all retries failed, throw the last error
           if (!chatResponse) {
             throw lastError || new Error('All retry attempts failed');
           }
                   } catch (fetchError) {
            console.error(`[ERROR] Failed to call external chatbot service after retries:`, fetchError);
            console.warn("[WARN] External chatbot service unavailable, using mock response");
            
            // Generate mock responses based on user input
            chatResponse = generateMockChatResponse(chatInput);
            
            // Ensure mock response has the correct structure
            if (typeof chatResponse.output === 'string') {
              try {
                const mockParsed = JSON.parse(chatResponse.output);
                chatResponse = { output: mockParsed };
              } catch (e) {
                // Keep as is if parsing fails
              }
            }
          }
      
      // Ensure chatResponse is always defined
      if (!chatResponse) {
        console.error("[ERROR] chatResponse is null, this should not happen");
        chatResponse = generateMockChatResponse(chatInput);
      }
      
      console.log("[DEBUG] Final chatResponse structure:", {
        hasOutput: !!chatResponse.output,
        outputType: typeof chatResponse.output,
        outputKeys: chatResponse.output && typeof chatResponse.output === 'object' ? Object.keys(chatResponse.output) : 'N/A'
      });
      
      // Parse the output to extract structured response
      let aiMessage: any = {
        type: 'ai',
        content: "Processing your request...",
        timestamp: Date.now()
      };

      // Now chatResponse.output should already be parsed JSON object
      try {
        if (chatResponse && chatResponse.output && typeof chatResponse.output === 'object' && (chatResponse.output as any).answer) {
          const parsedData = chatResponse.output as any;
          
                     // Transform the answer into a cleaner, more polished format
           let cleanAnswer = formatChatbotResponse(parsedData.answer);
          
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
        } else {
          // If no valid 'answer' field found, try to extract from different formats
          console.warn("[WARN] No valid answer field found in response:", chatResponse.output);
          
                     if (chatResponse.output && typeof chatResponse.output === 'string') {
             // Try to parse as JSON if it's a string
             try {
               // First, try to extract JSON from markdown code blocks if present
               let jsonString = chatResponse.output;
               
               // Check if it's wrapped in markdown code blocks
               const codeBlockMatch = chatResponse.output.match(/```(?:json)?\s*([\s\S]*?)```/);
               if (codeBlockMatch) {
                 jsonString = codeBlockMatch[1]; // Extract content inside code blocks
                 console.log(`[DEBUG] Extracted JSON from markdown code blocks in fallback:`, jsonString);
               }
               
               // Clean the string to handle newlines and formatting issues
               let cleanString = jsonString
                 .replace(/\n/g, ' ')           // Replace newlines with spaces
                 .replace(/\r/g, ' ')           // Replace carriage returns with spaces
                 .replace(/\t/g, ' ')           // Replace tabs with spaces
                 .replace(/\s+/g, ' ')          // Normalize multiple spaces
                 .trim();                       // Trim whitespace
               
               const fallbackParsed = JSON.parse(cleanString);
                               if (fallbackParsed.answer) {
                  aiMessage.content = formatChatbotResponse(fallbackParsed.answer);
                  aiMessage.documentReference = fallbackParsed.FileID ? {
                    fileId: fallbackParsed.FileID,
                    fileName: fallbackParsed.FileName,
                    fileLink: fallbackParsed.FileLink,
                    from: fallbackParsed.From,
                    to: fallbackParsed.To
                  } : undefined;
                  console.log("[DEBUG] Successfully parsed fallback response:", fallbackParsed);
                } else {
                  aiMessage.content = "I received a response, but it did not contain a clear answer. Please try rephrasing your question.";
                }
             } catch (fallbackError) {
               // If it's not JSON, use as plain text
               aiMessage.content = chatResponse.output;
               console.log("[DEBUG] Using output as plain text:", chatResponse.output);
             }
          } else {
            aiMessage.content = "I received a response, but it did not contain a clear answer. Please try rephrasing your question.";
          }
        }
      } catch (parseError) {
        console.error("Error during final parsing of chatResponse.output to structured data:", parseError);
        aiMessage.content = "An unexpected error occurred while interpreting the chatbot's response format.";
      }

      // Save AI response to storage
      await storage.saveChatMessage({
        session_id: sessionId,
        message: aiMessage
      });

      // Final validation before sending response
      console.log("[DEBUG] Final aiMessage being sent to client:", {
        type: aiMessage.type,
        contentLength: aiMessage.content?.length || 0,
        hasDocumentReference: !!aiMessage.documentReference,
        hasSearchInfo: !!aiMessage.searchInfo
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
