import { apiRequest } from "./queryClient";
import { Document, ChatMessage } from "../types";

export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    const response = await apiRequest("POST", "/api/documents", {});
    return response.json();
  },
};

export const chatApi = {
  sendMessage: async (chatInput: string, sessionId: string): Promise<ChatMessage> => {
    const response = await apiRequest("POST", "/api/chat", { chatInput, sessionId });
    return response.json();
  },

  getHistory: async (sessionId: string) => {
    const response = await apiRequest("GET", `/api/chat/${sessionId}`);
    return response.json();
  },
};

export const sessionsApi = {
  getAll: async (): Promise<string[]> => {
    const response = await apiRequest("GET", "/api/sessions");
    return response.json();
  },

  delete: async (sessionId: string) => {
    const response = await apiRequest("DELETE", `/api/sessions/${sessionId}`);
    return response.json();
  },
};
