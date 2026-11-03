import { useQuery } from '@tanstack/react-query';
import { body, request } from './api';
import type {
  ContextPreview,
  Decision,
  DecisionInput,
  Project,
  ProjectInput,
  ProjectMemory,
  ProjectMemoryInput,
  TaskInput,
  TaskRun,
  TaskStatus,
} from './workbench-types';

export const workbench = {
  importTwinMemories: (projectId: string, twin_id: string, memory_ids: string[], kind: string) =>
    request<{ imported: number; already_present_or_empty: number }>(
      `/api/projects/${projectId}/import-twin-memories`,
      body('POST', { twin_id, memory_ids, kind }),
    ),
  projects: () => request<{ projects: Project[] }>('/api/projects').then((r) => r.projects),
  project: (id: string) =>
    request<{ project: Project }>(`/api/projects/${id}`).then((r) => r.project),
  saveProject: (value: ProjectInput, id?: string) =>
    request<{ project: Project }>(
      `/api/projects${id ? `/${id}` : ''}`,
      body(id ? 'PUT' : 'POST', value),
    ),
  memories: (id: string) =>
    request<{ memories: ProjectMemory[] }>(`/api/projects/${id}/memories`).then((r) => r.memories),
  saveMemory: (project: string, value: ProjectMemoryInput, id?: string) =>
    request<{ memory: ProjectMemory }>(
      `/api/projects/${project}/memories${id ? `/${id}` : ''}`,
      body(id ? 'PUT' : 'POST', value),
    ),
  preview: (id: string, value: TaskInput) =>
    request<ContextPreview>(`/api/projects/${id}/context`, body('POST', value)),
  run: (id: string, value: TaskInput & { preview_token: string; request_id: string }) =>
    request<{ task: TaskRun }>(`/api/projects/${id}/tasks`, body('POST', value)).then(
      (r) => r.task,
    ),
  tasks: (project?: string) =>
    request<{ tasks: TaskRun[] }>(`/api/tasks${project ? `?project_id=${project}` : ''}`).then(
      (r) => r.tasks,
    ),
  task: (id: string) => request<{ task: TaskRun }>(`/api/tasks/${id}`).then((r) => r.task),
  review: (id: string, status: TaskStatus, review_notes: string) =>
    request<{ task: TaskRun }>(`/api/tasks/${id}/review`, body('PUT', { status, review_notes })),
  decisions: (project?: string) =>
    request<{ decisions: Decision[] }>(
      `/api/decisions${project ? `?project_id=${project}` : ''}`,
    ).then((r) => r.decisions),
  saveDecision: (project: string, value: DecisionInput, id?: string) =>
    request<{ decision: Decision }>(
      `/api/projects/${project}/decisions${id ? `/${id}` : ''}`,
      body(id ? 'PUT' : 'POST', value),
    ),
};
export const useProjects = () => useQuery({ queryKey: ['projects'], queryFn: workbench.projects });
export const useProjectMemories = (id: string) =>
  useQuery({
    queryKey: ['project-memories', id],
    queryFn: () => workbench.memories(id),
    enabled: !!id,
  });
export const useTasks = (id?: string) =>
  useQuery({ queryKey: ['tasks', id || 'all'], queryFn: () => workbench.tasks(id) });
export const useDecisions = (id?: string) =>
  useQuery({ queryKey: ['decisions', id || 'all'], queryFn: () => workbench.decisions(id) });
export const memoryKinds = ['fact', 'preference', 'research', 'instruction', 'decision'] as const;
export const taskKinds = ['analyze', 'compare', 'plan', 'draft'] as const;
export const dueForReview = (date: string) =>
  !!date && date <= new Date().toISOString().slice(0, 10);
export const statusLabel = (status: string) => status.replaceAll('_', ' ');
