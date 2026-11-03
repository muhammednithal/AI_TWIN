import { useQuery } from '@tanstack/react-query';
import { api } from './api';
export const useTwins = () => useQuery({ queryKey: ['twins'], queryFn: api.twins });
export const useSessions = () => useQuery({ queryKey: ['sessions'], queryFn: api.sessions });
export const useMemories = (id: string) =>
  useQuery({ queryKey: ['memories', id], queryFn: () => api.memories(id), enabled: !!id });
