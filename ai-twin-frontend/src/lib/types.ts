export type User = { id: string; display_name: string; email: string };
export type Sample = { id?: string; text: string };
export type Twin = {
  id: string;
  name: string;
  language: string;
  style_summary: string;
  sliders: Record<string, number>;
  samples: Sample[];
  created_at: string;
  updated_at: string;
};
export type TwinInput = Pick<Twin, 'name' | 'language' | 'style_summary' | 'sliders' | 'samples'>;
export type Memory = {
  id: string;
  personality_id: string;
  content: string;
  tags: string;
  created_at: string;
};
export type Source = { id: string; text: string; kind: 'sample' | 'memory'; score: number };
export type Message = {
  id: string;
  from_user: boolean;
  content: string;
  created_at: string;
  metadata?: { sources?: Source[] };
};
export type Session = {
  id: string;
  personality_id: string;
  title: string;
  updated_at: string;
  messages?: Message[];
};
export type Auth = { user: User; token: string };
export type ChatResult = {
  reply: string;
  session_id: string;
  messages: Message[];
  sources: Source[];
};
