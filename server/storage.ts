import { 
  type User, 
  type InsertUser, 
  type UserSession,
  type InsertUserSession,
  type ChatSession, 
  type InsertChatSession 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session management
  createUserSession(data: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  getChatHistory(sessionId: string): Promise<ChatSession[]>;
  saveChatMessage(chat: InsertChatSession): Promise<ChatSession>;
  getAllChatSessions(): Promise<string[]>;
  deleteChatSession(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userSessions: Map<string, UserSession>;
  private chatHistory: Map<string, ChatSession[]>;

  constructor() {
    this.users = new Map();
    this.userSessions = new Map();
    this.chatHistory = new Map();
    
    // Create default user for testing
    this.createUser({
      username: 'Suryakanta.Karan',
      password: 'Surya@123'
    });
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
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createUserSession(data: InsertUserSession): Promise<UserSession> {
    const id = randomUUID();
    const session: UserSession = {
      ...data,
      id,
      created_at: new Date(),
    };
    this.userSessions.set(data.session_id, session);
    return session;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    const session = this.userSessions.get(sessionId);
    if (session && session.expires_at < new Date()) {
      this.userSessions.delete(sessionId);
      return undefined;
    }
    return session;
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    this.userSessions.delete(sessionId);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions = Array.from(this.userSessions.entries())
      .filter(([_, session]) => session.expires_at < now)
      .map(([sessionId]) => sessionId);
    
    expiredSessions.forEach(sessionId => {
      this.userSessions.delete(sessionId);
    });
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
