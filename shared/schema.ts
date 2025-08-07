import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatSessions = pgTable("n8n_chat_histories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  session_id: text("session_id").notNull(),
  message: jsonb("message").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  created_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

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
}

export interface ChatResponse {
  output: string;
}
