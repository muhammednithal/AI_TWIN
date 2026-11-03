export type Project = {
  id: string;
  user_id: string;
  name: string;
  purpose: string;
  instructions: string;
  archived: boolean;
  memory_count: number;
  task_count: number;
  created_at: string;
  updated_at: string;
};
export type ProjectInput = Pick<Project, 'name' | 'purpose' | 'instructions' | 'archived'>;
export type MemoryKind = 'fact' | 'preference' | 'research' | 'instruction' | 'decision';
export type ProjectMemory = {
  id: string;
  project_id: string;
  title: string;
  kind: MemoryKind;
  content: string;
  tags: string;
  source: string;
  source_task_id?: string;
  pinned: boolean;
  archived: boolean;
  review_on: string;
  version: number;
  created_at: string;
  updated_at: string;
};
export type ProjectMemoryInput = Pick<
  ProjectMemory,
  | 'title'
  | 'kind'
  | 'content'
  | 'tags'
  | 'source'
  | 'pinned'
  | 'archived'
  | 'review_on'
  | 'source_task_id'
>;
export type TaskKind = 'analyze' | 'compare' | 'plan' | 'draft';
export type TaskInput = { objective: string; kind: TaskKind; memory_ids: string[] };
export type ContextMemory = Pick<
  ProjectMemory,
  | 'id'
  | 'title'
  | 'kind'
  | 'content'
  | 'source'
  | 'source_task_id'
  | 'version'
  | 'review_on'
  | 'updated_at'
> & { label: string; reason: string };
export type TaskContext = {
  prompt_version: number;
  project_id: string;
  project_name: string;
  purpose: string;
  instructions: string;
  objective: string;
  kind: TaskKind;
  memories: ContextMemory[];
  warnings: string[];
};
export type ContextPreview = { context: TaskContext; preview_token: string };
export type TaskStatus = 'needs_review' | 'accepted' | 'dismissed';
export type TaskRun = {
  id: string;
  project_id: string;
  request_id: string;
  objective: string;
  kind: TaskKind;
  context_count: number;
  result?: string;
  context_snapshot?: TaskContext;
  status: TaskStatus;
  review_notes: string;
  created_at: string;
  updated_at: string;
};
export type Decision = {
  id: string;
  project_id: string;
  task_id?: string;
  title: string;
  choice: string;
  reasoning: string;
  assumptions: string;
  outcome: string;
  status: 'considering' | 'decided' | 'closed';
  review_on: string;
  created_at: string;
  updated_at: string;
};
export type DecisionInput = Pick<
  Decision,
  'task_id' | 'title' | 'choice' | 'reasoning' | 'assumptions' | 'outcome' | 'status' | 'review_on'
>;
