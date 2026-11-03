import { useState } from 'react';
import Markdown from 'react-markdown';
import { Button, Dialog, DialogContent, DialogTitle, DialogActions, Chip } from '@mui/material';
import type { ContextMemory, TaskRun } from '../../lib/workbench-types';
import { MarkdownContent } from '../../components/MarkdownContent';
import { memoryCitations, missingInformation } from './evidence';
import { dueForReview } from '../../lib/workbench';

export function EvidenceResult({ task }: { task: TaskRun }) {
  const [selected, setSelected] = useState<ContextMemory | null>(null);
  const memories = task.context_snapshot?.memories || [];
  const overdue = memories.filter((m) => dueForReview(m.review_on));
  const missing = missingInformation(task.result || '');
  return (
    <>
      <section className="decision-checks" aria-label="Check before deciding">
        <div className="eyebrow">A LITTLE CLARITY BEFORE YOUR NEXT STEP</div>
        <h3>Check before deciding</h3>
        <p>
          Based on {memories.length} saved memories. Sources are supplied context, not independently
          verified facts.
        </p>
        {overdue.length > 0 && (
          <div className="freshness-notice">
            <strong>{overdue.length} memories are due for review</strong>
            <p>A review date has passed. Confirm these notes are still useful.</p>
            {overdue.map((m) => (
              <Button key={m.id} size="small" onClick={() => setSelected(m)}>
                {m.title}
              </Button>
            ))}
          </div>
        )}
        {missing ? (
          <details open>
            <summary>Assumptions & missing information</summary>
            <MarkdownContent>{missing}</MarkdownContent>
          </details>
        ) : (
          <p className="muted-block">
            This result does not include a separate information-gap section. Check its assumptions
            and time-sensitive claims before acting.
          </p>
        )}
      </section>
      <div className="result-document markdown">
        <Markdown
          remarkPlugins={[memoryCitations]}
          disallowedElements={['img']}
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith('#memory-')) {
                const label = href.slice(8);
                const memory = memories.find((m) => m.label === label);
                return memory ? (
                  <Button
                    className="memory-citation"
                    size="small"
                    onClick={() => setSelected(memory)}
                    aria-label={`View ${label}: ${memory.title}`}
                  >
                    {children}
                  </Button>
                ) : (
                  <span
                    className="unresolved-citation"
                    title="This reference is not in the saved context"
                  >
                    {children} (unavailable reference)
                  </span>
                );
              }
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
          }}
        >
          {task.result || ''}
        </Markdown>
      </div>
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {selected?.title}
          <p className="dialog-subtitle">
            Saved context from this task · {selected?.label} · version {selected?.version}
          </p>
        </DialogTitle>
        <DialogContent>
          <Chip size="small" label={selected?.kind || 'memory'} />
          <p className="evidence-content">{selected?.content}</p>
          <p className="section-description">Source: {selected?.source || 'No source recorded'}</p>
          {selected?.review_on && (
            <p className="section-description">Review date: {selected.review_on}</p>
          )}
          <p className="section-description">
            This is the original snapshot. The current memory may have changed. A reference does not
            prove that the claim is correct.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
