import { Alert, Button, Chip } from '@mui/material';
import { Download, Pin } from 'lucide-react';
import { download } from '../../lib/api';
import type { TaskContext } from '../../lib/workbench-types';
export function ContextPanel({
  context,
  snapshot = false,
}: {
  context: TaskContext;
  snapshot?: boolean;
}) {
  return (
    <section className="context-panel">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            {snapshot ? 'IMMUTABLE INPUT SNAPSHOT' : 'CHECK BEFORE YOU RUN'}
          </div>
          <h2>{snapshot ? 'The context this task used' : 'Your exact task context'}</h2>
        </div>
        <Button
          size="small"
          startIcon={<Download size={14} />}
          onClick={() =>
            download(
              'twin-context-pack.json',
              JSON.stringify(
                { version: 1, context, exported_at: new Date().toISOString() },
                null,
                2,
              ),
            )
          }
        >
          Export pack
        </Button>
      </div>
      <p className="context-purpose">
        <strong>{context.project_name}</strong>
        {context.purpose && ` · ${context.purpose}`}
      </p>
      <p className="context-objective">
        <strong>Task · {context.kind}</strong>
        <br />
        {context.objective}
      </p>
      {context.instructions && (
        <div className="project-instructions">
          <strong>Standing instructions · always included</strong>
          <p>{context.instructions}</p>
        </div>
      )}
      {context.warnings.map((w) => (
        <Alert key={w} severity="warning" sx={{ my: 1 }}>
          {w}
        </Alert>
      ))}
      <div className="context-memory-list">
        {context.memories.map((m) => (
          <details key={m.id} className="context-memory">
            <summary>
              <span className="context-label">{m.label}</span>
              <strong>{m.title}</strong>
              <span className="context-reason">
                {m.reason === 'pinned constraint' && <Pin size={12} />}
                {m.reason} · v{m.version}
              </span>
            </summary>
            <div>
              <Chip label={m.kind} size="small" />
              <p>{m.content}</p>
              {m.source && <small>Source: {m.source}</small>}
              {m.source_task_id && <small>Originally saved from a task result</small>}
              {m.review_on && <small>Review on: {m.review_on}</small>}
            </div>
          </details>
        ))}
      </div>
      <p className="context-disclosure">
        Running this task sends the project brief, objective, and these {context.memories.length}{' '}
        memories to Gemini. URLs are notes, not fetched sources. No live web data or external
        actions.
      </p>
    </section>
  );
}
