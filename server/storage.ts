import { type User, type InsertUser, type ChatSession, type InsertChatSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getChatHistory(sessionId: string): Promise<ChatSession[]>;
  saveChatMessage(chat: InsertChatSession): Promise<ChatSession>;
  getAllChatSessions(): Promise<string[]>;
  deleteChatSession(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatHistory: Map<string, ChatSession[]>;

  constructor() {
    this.users = new Map();
    this.chatHistory = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatHistory(sessionId: string): Promise<ChatSession[]> {
    return this.chatHistory.get(sessionId) || [];
  }

  async saveChatMessage(chat: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const chatSession: ChatSession = {
      ...chat,
      id,
      created_at: new Date(),
    };

    const existing = this.chatHistory.get(chat.session_id) || [];
    existing.push(chatSession);
    this.chatHistory.set(chat.session_id, existing);

    return chatSession;
  }

  async getAllChatSessions(): Promise<string[]> {
    return Array.from(this.chatHistory.keys());
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    this.chatHistory.delete(sessionId);
  }
}

export const storage = new MemStorage();
