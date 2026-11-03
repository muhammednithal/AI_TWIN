import { useState } from 'react';
import { Alert, Button, Chip, MenuItem, TextField } from '@mui/material';
import { Check, Copy, Download, FilePlus2, NotebookPen } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EvidenceResult } from './EvidenceResult';
import { ContextPanel } from './ContextPanel';
import { workbench, statusLabel } from '../../lib/workbench';
import { download, errorMessage } from '../../lib/api';
import { useApp } from '../../app/context';
import { ProjectMemoryEditor } from '../projects/ProjectMemories';
import { DecisionEditor } from '../decisions/DecisionEditor';
import type { Project, TaskRun, TaskStatus } from '../../lib/workbench-types';
export function TaskResult({ project, task }: { project: Project; task: TaskRun }) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [notes, setNotes] = useState(task.review_notes);
  const [copied, setCopied] = useState(false);
  const [memory, setMemory] = useState(false);
  const [decision, setDecision] = useState(false);
  const client = useQueryClient();
  const { notify } = useApp();
  const review = useMutation({
    mutationFn: () => workbench.review(task.id, status, notes),
    onSuccess: ({ task: saved }) => {
      client.setQueryData(['task', task.id], saved);
      client.invalidateQueries({ queryKey: ['tasks'] });
      notify('Review saved. Your task result and context remain unchanged.');
    },
  });
  async function copy() {
    try {
      await navigator.clipboard.writeText(task.result || '');
      setCopied(true);
    } catch {
      notify('Select the result text to copy it.');
    }
  }
  return (
    <div className="task-result">
      <div className="task-result-heading">
        <div>
          <div className="eyebrow">
            {task.kind.toUpperCase()} · {new Date(task.created_at).toLocaleString()}
          </div>
          <h2>{task.objective}</h2>
        </div>
        <Chip
          label={statusLabel(task.status)}
          color={task.status === 'accepted' ? 'success' : 'default'}
          size="small"
        />
      </div>
      <EvidenceResult key={task.id} task={task} />
      <div className="result-actions">
        <Button
          size="small"
          startIcon={copied ? <Check size={15} /> : <Copy size={15} />}
          onClick={copy}
        >
          {copied ? 'Copied' : 'Copy result'}
        </Button>
        <Button
          size="small"
          startIcon={<Download size={15} />}
          onClick={() =>
            download(
              'twin-task-result.md',
              `# ${task.objective}\n\n${task.result}\n\n## Context\n${task.context_snapshot?.memories.map((m) => `- [${m.label}] ${m.title} (v${m.version}; ${m.reason})`).join('\n') || 'Project brief only'}`,
              'text/markdown',
            )
          }
        >
          Markdown
        </Button>
        <Button
          size="small"
          startIcon={<FilePlus2 size={15} />}
          disabled={project.archived}
          onClick={() => setMemory(true)}
        >
          Save as memory
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<NotebookPen size={15} />}
          disabled={project.archived}
          onClick={() => setDecision(true)}
        >
          Record a decision
        </Button>
      </div>
      <section className="task-review">
        <h3>Your review</h3>
        <p className="section-description">
          Accepting a result records your review. It doesn’t execute an action or turn the output
          into a verified fact.
        </p>
        <div className="review-fields">
          <TextField
            select
            label="Review status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {['needs_review', 'accepted', 'dismissed'].map((s) => (
              <MenuItem key={s} value={s}>
                {statusLabel(s)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="What is useful? What needs correcting?"
            multiline
            minRows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
          />
        </div>
        {review.error && <Alert severity="error">{errorMessage(review.error)}</Alert>}
        <Button variant="contained" disabled={review.isPending} onClick={() => review.mutate()}>
          {review.isPending ? 'Saving review…' : 'Save review'}
        </Button>
      </section>
      {task.context_snapshot && <ContextPanel context={task.context_snapshot} snapshot />}
      {memory && (
        <ProjectMemoryEditor
          projectId={project.id}
          initial={{
            title: task.objective.slice(0, 120),
            kind: 'research',
            content: (task.result || '').slice(0, 4000),
            source: `AI task result · ${task.id}`,
            source_task_id: task.id,
          }}
          close={() => setMemory(false)}
        />
      )}
      {decision && (
        <DecisionEditor
          projectId={project.id}
          initial={{ title: task.objective.slice(0, 120), task_id: task.id }}
          close={() => setDecision(false)}
        />
      )}
    </div>
  );
}
