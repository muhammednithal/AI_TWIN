import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { Archive, ArchiveRestore, Download, Pencil, Pin, Plus, Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { download, errorMessage } from '../../lib/api';
import { dueForReview, memoryKinds, workbench } from '../../lib/workbench';
import { dateLabel } from '../../lib/format';
import { useApp } from '../../app/context';
import type { Project, ProjectMemory, ProjectMemoryInput } from '../../lib/workbench-types';
import { ImportMemories } from './ImportMemories';

export function ProjectMemories({
  project,
  memories,
}: {
  project: Project;
  memories: ProjectMemory[];
}) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [archived, setArchived] = useState(false);
  const [editor, setEditor] = useState<ProjectMemory | 'new' | null>(null);
  const [importing, setImporting] = useState(false);
  const client = useQueryClient();
  const { notify } = useApp();
  const update = useMutation({
    mutationFn: (m: ProjectMemory) =>
      workbench.saveMemory(project.id, { ...m, archived: !m.archived }, m.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['project-memories', project.id] });
      client.invalidateQueries({ queryKey: ['projects'] });
      notify('Memory updated. Saved task snapshots are unchanged.');
    },
  });
  const visible = memories.filter(
    (m) =>
      m.archived === archived &&
      (kind === 'all' || m.kind === kind) &&
      `${m.title} ${m.content} ${m.tags} ${m.source}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>What should this project remember?</h2>
          <p className="section-description">
            Facts, preferences, research, and instructions. Pin constraints to include them in every
            task.
          </p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          disabled={project.archived}
          onClick={() => setEditor('new')}
        >
          Add memory
        </Button>
      </div>
      <div className="import-context-action">
        <Button size="small" disabled={project.archived} onClick={() => setImporting(true)}>
          Bring memories from a twin
        </Button>
        <span>Copy useful context without changing the originals.</span>
      </div>
      <div className="project-memory-toolbar">
        <TextField
          placeholder="Search context…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: { startAdornment: <Search className="search-icon" size={17} /> },
            htmlInput: { 'aria-label': 'Search project memories' },
          }}
        />
        <TextField select label="Type" value={kind} onChange={(e) => setKind(e.target.value)}>
          {['all', ...memoryKinds].map((k) => (
            <MenuItem key={k} value={k}>
              {k === 'all' ? 'All types' : k}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Switch checked={archived} onChange={(_, v) => setArchived(v)} />}
          label="Archived"
        />
        <Tooltip title="Export active memories as a portable context pack">
          <IconButton
            aria-label="Export project memories"
            onClick={() =>
              download(
                'project-context.json',
                JSON.stringify(
                  {
                    version: 1,
                    exported_at: new Date().toISOString(),
                    project: {
                      name: project.name,
                      purpose: project.purpose,
                      instructions: project.instructions,
                    },
                    memories: memories.filter((m) => !m.archived),
                  },
                  null,
                  2,
                ),
              )
            }
          >
            <Download size={18} />
          </IconButton>
        </Tooltip>
      </div>
      {update.error && <Alert severity="error">{errorMessage(update.error)}</Alert>}
      {!visible.length ? (
        <div className="empty">
          <h2>
            {memories.length
              ? 'No memories in this view.'
              : 'A small detail can change the next decision.'}
          </h2>
          <p>
            {memories.length
              ? 'Try another type, search, or archive filter.'
              : 'Add a preference, a useful fact, or the research you want to carry forward.'}
          </p>
          {!memories.length && (
            <Button onClick={() => setEditor('new')} disabled={project.archived}>
              Add your first memory
            </Button>
          )}
        </div>
      ) : (
        <div className="knowledge-grid">
          {visible.map((m) => (
            <article className={`knowledge-card ${m.pinned ? 'is-pinned' : ''}`} key={m.id}>
              <div className="card-top">
                <div className="tag-row">
                  <span>{m.kind}</span>
                  {m.pinned && (
                    <span className="pinned-label">
                      <Pin size={12} />
                      Always included
                    </span>
                  )}
                </div>
                <div>
                  <IconButton
                    size="small"
                    aria-label={`Edit ${m.title}`}
                    disabled={project.archived}
                    onClick={() => setEditor(m)}
                  >
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`${m.archived ? 'Restore' : 'Archive'} ${m.title}`}
                    disabled={project.archived || update.isPending}
                    onClick={() => update.mutate(m)}
                  >
                    {m.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                  </IconButton>
                </div>
              </div>
              <h3>{m.title}</h3>
              <p className="knowledge-content">{m.content}</p>
              {m.source && <p className="memory-provenance">Source: {m.source}</p>}
              {m.source_task_id && (
                <small className="memory-provenance">Saved from a task result · user-curated</small>
              )}
              <div className="knowledge-footer">
                <span>
                  v{m.version} · {dateLabel(m.updated_at)}
                </span>
                {dueForReview(m.review_on) ? (
                  <Chip label="Review due" color="warning" size="small" />
                ) : (
                  m.review_on && <span>Review {m.review_on}</span>
                )}
              </div>
              <div className="tag-row">
                {m.tags
                  .split(',')
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag}>{tag.trim()}</span>
                  ))}
              </div>
            </article>
          ))}
        </div>
      )}
      {editor && (
        <ProjectMemoryEditor
          projectId={project.id}
          memory={editor === 'new' ? undefined : editor}
          close={() => setEditor(null)}
        />
      )}
      {importing && <ImportMemories projectId={project.id} close={() => setImporting(false)} />}
    </>
  );
}
export function ProjectMemoryEditor({
  projectId,
  memory,
  initial,
  close,
}: {
  projectId: string;
  memory?: ProjectMemory;
  initial?: Partial<ProjectMemoryInput>;
  close: () => void;
}) {
  const [value, setValue] = useState<ProjectMemoryInput>({
    title: memory?.title || initial?.title || '',
    kind: memory?.kind || initial?.kind || 'fact',
    content: memory?.content || initial?.content || '',
    tags: memory?.tags || '',
    source: memory?.source || initial?.source || '',
    source_task_id: memory?.source_task_id || initial?.source_task_id,
    pinned: memory?.pinned || false,
    archived: memory?.archived || false,
    review_on: memory?.review_on || '',
  });
  const client = useQueryClient();
  const { notify } = useApp();
  const save = useMutation({
    mutationFn: () => workbench.saveMemory(projectId, value, memory?.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['project-memories', projectId] });
      client.invalidateQueries({ queryKey: ['projects'] });
      notify('Project memory saved.');
      close();
    },
  });
  return (
    <Dialog open onClose={save.isPending ? undefined : close} maxWidth="sm" fullWidth>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!save.isPending) save.mutate();
        }}
      >
        <DialogTitle>
          {memory ? 'Refine a memory' : 'Save useful context'}
          <p className="dialog-subtitle">
            Stored as your note. Included in AI processing when used in a task.
          </p>
        </DialogTitle>
        <DialogContent className="form-stack">
          {save.error && <Alert severity="error">{errorMessage(save.error)}</Alert>}
          {initial?.source_task_id && (
            <Alert severity="info">
              This is a draft excerpt of AI output. Edit and verify it before saving as a memory.
            </Alert>
          )}
          <TextField
            autoFocus
            required
            label="Title"
            value={value.title}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          <TextField
            select
            label="Memory type"
            value={value.kind}
            onChange={(e) =>
              setValue({ ...value, kind: e.target.value as ProjectMemoryInput['kind'] })
            }
          >
            {memoryKinds.map((k) => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            multiline
            minRows={5}
            label="What should be remembered?"
            value={value.content}
            onChange={(e) => setValue({ ...value, content: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
            helperText={`${value.content.length}/4,000 characters`}
          />
          <TextField
            label="Source or provenance"
            value={value.source}
            onChange={(e) => setValue({ ...value, source: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            helperText="For example: my preference, meeting notes, or a document URL. URLs are recorded, not fetched."
          />
          <TextField
            label="Tags"
            value={value.tags}
            onChange={(e) => setValue({ ...value, tags: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            placeholder="goals, evidence, preferences"
          />
          <TextField
            label="Review on"
            type="date"
            value={value.review_on}
            onChange={(e) => setValue({ ...value, review_on: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Optional. The context preview flags memories whose review date has arrived."
          />
          <FormControlLabel
            control={
              <Switch
                checked={value.pinned}
                onChange={(_, v) => setValue({ ...value, pinned: v })}
              />
            }
            label="Always include as a pinned constraint"
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={save.isPending} onClick={close}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save memory'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
