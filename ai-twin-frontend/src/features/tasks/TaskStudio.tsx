import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
} from '@mui/material';
import { ArrowRight, CheckCheck, Pin, Play, Plus, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Failure, Loading } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { dueForReview, statusLabel, taskKinds, useTasks, workbench } from '../../lib/workbench';
import type {
  ContextPreview,
  Project,
  ProjectMemory,
  TaskInput,
  TaskKind,
} from '../../lib/workbench-types';
import { ContextPanel } from './ContextPanel';
import { TaskResult } from './TaskResult';
const starters: Record<TaskKind, string> = {
  analyze:
    'Evaluate the question using my selected research and constraints. Separate evidence from assumptions and identify information I still need to verify.',
  compare:
    'Compare my options against the selected criteria. Show trade-offs, uncertainties, and what information would change the comparison.',
  plan: 'Turn my goal into a realistic plan using these preferences and constraints. Suggest practical next steps and a way to review progress.',
  draft:
    'Draft a clear response using my selected facts and preferences. Preserve important constraints and mark any missing details.',
};
export function TaskStudio({ project, memories }: { project: Project; memories: ProjectMemory[] }) {
  const [params, setParams] = useSearchParams();
  const taskId = params.get('task') || '';
  const [input, setInput] = useState<TaskInput>({ objective: '', kind: 'analyze', memory_ids: [] });
  const [preview, setPreview] = useState<ContextPreview | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const mounted = useRef(true);
  const runFlight = useRef(false);
  const client = useQueryClient();
  const history = useTasks(project.id);
  const task = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => workbench.task(taskId),
    enabled: !!taskId,
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const prepare = useMutation({
    mutationFn: () => workbench.preview(project.id, input),
    onSuccess: (result) => {
      setPreview(result);
      setRequestId(crypto.randomUUID());
    },
  });
  const run = useMutation({
    mutationFn: () =>
      workbench.run(project.id, {
        ...input,
        preview_token: preview!.preview_token,
        request_id: requestId,
      }),
    onSuccess: (result) => {
      client.setQueryData(['task', result.id], result);
      client.invalidateQueries({ queryKey: ['tasks'] });
      client.invalidateQueries({ queryKey: ['projects'] });
      if (mounted.current) setParams({ tab: 'tasks', task: result.id });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setPreview(null);
        client.invalidateQueries({ queryKey: ['project', project.id] });
        client.invalidateQueries({ queryKey: ['project-memories', project.id] });
      }
    },
    onSettled: () => {
      runFlight.current = false;
    },
  });
  const busy = prepare.isPending || run.isPending;
  const change = (next: TaskInput) => {
    setInput(next);
    setPreview(null);
    setRequestId(crypto.randomUUID());
    prepare.reset();
    run.reset();
  };
  const selected = memories.filter(
    (m) => !m.archived && (m.pinned || input.memory_ids.includes(m.id)),
  );
  const changed =
    !!preview &&
    (preview.context.project_name !== project.name ||
      preview.context.purpose !== project.purpose ||
      preview.context.instructions !== project.instructions ||
      preview.context.memories.some(
        (m) => !memories.some((n) => n.id === m.id && n.version === m.version && !n.archived),
      ) ||
      memories.some(
        (m) => m.pinned && !m.archived && !preview.context.memories.some((n) => n.id === m.id),
      ));
  const newTask = () => {
    setParams({ tab: 'tasks' });
    change({ objective: '', kind: 'analyze', memory_ids: [] });
  };
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>A task with your context behind it.</h2>
          <p className="section-description">
            Choose the memories. Preview what will be sent. Review the result.
          </p>
        </div>
        <Button
          startIcon={<Plus size={16} />}
          onClick={newTask}
          disabled={busy || project.archived}
        >
          New task
        </Button>
      </div>
      <div className="task-workspace">
        <aside className="task-history">
          <div className="eyebrow">RECENT TASKS</div>
          {history.error && <Failure error={history.error} retry={() => history.refetch()} />}
          {history.data?.map((t) => (
            <button
              key={t.id}
              disabled={busy}
              className={taskId === t.id ? 'active' : ''}
              onClick={() => setParams({ tab: 'tasks', task: t.id })}
            >
              <strong>{t.objective}</strong>
              <small>
                {t.kind} · {statusLabel(t.status)}
              </small>
            </button>
          ))}
          {!history.data?.length && (
            <p>Your task results will live here, together with the context they used.</p>
          )}
        </aside>
        <div className="task-main">
          {taskId ? (
            task.isPending ? (
              <Loading />
            ) : task.error ? (
              <Failure error={task.error} retry={() => task.refetch()} />
            ) : task.data.project_id !== project.id ? (
              <Alert severity="error">This task belongs to another project.</Alert>
            ) : (
              <TaskResult key={task.data.id} project={project} task={task.data} />
            )
          ) : (
            <>
              <div className="task-brief">
                <div className="eyebrow">
                  <Sparkles size={14} /> START WITH A USEFUL RESULT
                </div>
                <TextField
                  select
                  label="Task type"
                  value={input.kind}
                  disabled={busy || project.archived}
                  onChange={(e) => change({ ...input, kind: e.target.value as TaskKind })}
                >
                  {taskKinds.map((k) => (
                    <MenuItem key={k} value={k}>
                      {k}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="What would you like to accomplish?"
                  multiline
                  minRows={5}
                  value={input.objective}
                  disabled={busy || project.archived}
                  onChange={(e) => change({ ...input, objective: e.target.value })}
                  slotProps={{ htmlInput: { maxLength: 12000 } }}
                  placeholder="Describe the question, options, or result you need. Include the material you want analyzed."
                />
                <Button
                  className="use-template"
                  size="small"
                  onClick={() => change({ ...input, objective: starters[input.kind] })}
                  disabled={busy || project.archived}
                >
                  Use a starting template <ArrowRight size={14} />
                </Button>
              </div>
              <section className="context-picker">
                <div className="section-heading">
                  <div>
                    <h3>Choose your context</h3>
                    <p className="section-description">
                      Pinned memories are always included. Everything else is your choice.
                    </p>
                  </div>
                  <Chip label={`${selected.length}/30`} size="small" />
                </div>
                {!memories.some((m) => !m.archived) && (
                  <p className="muted-block">
                    No active memories yet. You can run a task with the project brief alone, or add
                    context in the Memories tab.
                  </p>
                )}
                {memories
                  .filter((m) => !m.archived)
                  .map((m) => (
                    <label key={m.id} className={`context-pick ${m.pinned ? 'pinned' : ''}`}>
                      <Checkbox
                        checked={m.pinned || input.memory_ids.includes(m.id)}
                        disabled={m.pinned || busy || project.archived}
                        onChange={(_, checked) =>
                          change({
                            ...input,
                            memory_ids: checked
                              ? [...input.memory_ids, m.id]
                              : input.memory_ids.filter((id) => id !== m.id),
                          })
                        }
                      />
                      <div>
                        <strong>{m.title}</strong>
                        <p>{m.content}</p>
                        <small>
                          {m.kind} · v{m.version}
                          {dueForReview(m.review_on) ? ' · Review due' : ''}
                        </small>
                      </div>
                      {m.pinned && <Pin size={16} />}
                    </label>
                  ))}
              </section>
              {selected.length > 30 && (
                <Alert severity="warning">
                  More than 30 memories are included. Unpin or deselect some before preparing
                  context.
                </Alert>
              )}
              {prepare.error && <Failure error={prepare.error} />}
              {run.error && <Failure error={run.error} />}
              {changed && (
                <Alert severity="warning">
                  Your project context has changed. Preview it again before running.
                </Alert>
              )}
              <div className="task-controls">
                <Button
                  variant="outlined"
                  startIcon={
                    prepare.isPending ? <CircularProgress size={15} /> : <CheckCheck size={17} />
                  }
                  disabled={
                    busy || !input.objective.trim() || selected.length > 30 || project.archived
                  }
                  onClick={() => prepare.mutate()}
                >
                  {prepare.isPending ? 'Preparing context…' : 'Preview context'}
                </Button>
                <Button
                  variant="contained"
                  startIcon={
                    run.isPending ? (
                      <CircularProgress size={15} color="inherit" />
                    ) : (
                      <Play size={17} />
                    )
                  }
                  disabled={busy || !preview || changed || project.archived}
                  onClick={() => {
                    if (!runFlight.current && preview) {
                      runFlight.current = true;
                      run.mutate();
                    }
                  }}
                >
                  {run.isPending ? 'Working with your context…' : 'Run with this context'}
                </Button>
              </div>
              {preview && <ContextPanel context={preview.context} />}
              <p className="context-disclosure">
                Tasks use saved context and model reasoning. They do not browse the web, fetch
                current market data, or execute external actions.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
