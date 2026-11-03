import { dateLabel } from '../../lib/format';
import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import { Brain, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemories, useTwins } from '../../lib/queries';
import { Confirm, Empty, Failure, Loading, PageTitle } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useApp } from '../../app/context';
import type { Memory } from '../../lib/types';
export function MemoryPage() {
  const twins = useTwins();
  const [selected, setSelected] = useState('');
  const id = twins.data?.some((t) => t.id === selected) ? selected : twins.data?.[0]?.id || '';
  const memories = useMemories(id);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Memory | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const client = useQueryClient();
  const { notify } = useApp();
  const remove = useMutation({
    mutationFn: (key: string) => api.deleteMemory(key),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['memories'] });
      setDeleting(null);
      notify('Memory deleted.');
    },
  });
  if (twins.isPending) return <Loading />;
  if (twins.error) return <Failure error={twins.error} retry={() => twins.refetch()} />;
  return (
    <>
      <PageTitle
        eyebrow="THE LITTLE THINGS THAT MATTER"
        title="A memory of you."
        description="Preferences, goals, and everyday details. You choose what your twin remembers."
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            disabled={!id}
            onClick={() => setEditor('new')}
          >
            Add a memory
          </Button>
        }
      />
      {!twins.data.length ? (
        <Empty
          title="First, a twin to remember you."
          description="Create your twin, then give it the context that makes conversations personal."
          to="/twins?create=1"
          label="Create a twin"
        />
      ) : (
        <>
          <div className="memory-banner">
            <span className="stat-icon lavender">
              <Brain size={23} />
            </span>
            <div>
              <strong>Useful context, with you in control.</strong>
              <p>
                Memories are retrieved when relevant to a conversation. Nothing is saved
                automatically.
              </p>
            </div>
            <span className="subtle-badge">CURATED BY YOU</span>
          </div>
          <div className="toolbar memory-toolbar">
            <TextField
              select
              label="Memories for"
              value={id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {twins.data.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              placeholder="Search memories or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: { startAdornment: <Search size={17} className="search-icon" /> },
              }}
            />
          </div>
          {memories.isPending ? (
            <Loading />
          ) : memories.error ? (
            <Failure error={memories.error} retry={() => memories.refetch()} />
          ) : (
            <>
              <div className="section-heading">
                <h2>{memories.data.length} saved memories</h2>
                <span className="muted">A little context goes a long way.</span>
              </div>
              {!memories.data.length ? (
                <div className="empty">
                  <Brain size={28} />
                  <h2>What should your twin know?</h2>
                  <p>
                    “I prefer concise answers.” “I’m learning to build my own business.”
                    <br />
                    Start with one small detail.
                  </p>
                  <Button variant="outlined" onClick={() => setEditor('new')}>
                    Add your first memory
                  </Button>
                </div>
              ) : (
                <div className="memory-grid">
                  {memories.data
                    .filter((m) =>
                      `${m.content} ${m.tags}`.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((m, i) => (
                      <article className={`memory-card memory-tone-${i % 3}`} key={m.id}>
                        <div className="card-top">
                          <Brain size={18} />
                          <div>
                            <Tooltip title="Edit memory">
                              <IconButton
                                size="small"
                                aria-label="Edit memory"
                                onClick={() => setEditor(m)}
                              >
                                <Pencil size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete memory">
                              <IconButton
                                size="small"
                                aria-label="Delete memory"
                                onClick={() => setDeleting(m)}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </div>
                        <p>{m.content}</p>
                        <div className="memory-card-footer">
                          <div className="tag-row">
                            {m.tags
                              .split(',')
                              .filter(Boolean)
                              .map((tag) => (
                                <span key={tag}>{tag.trim()}</span>
                              ))}
                          </div>
                          <small>{dateLabel(m.created_at)}</small>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </>
          )}
          {editor && (
            <MemoryEditor
              memory={editor === 'new' ? null : editor}
              twinId={id}
              close={() => setEditor(null)}
            />
          )}
        </>
      )}
      <Confirm
        open={!!deleting}
        title="Forget this memory?"
        description="It will no longer be retrieved in future conversations. Existing conversation messages will remain."
        busy={remove.isPending}
        error={remove.error}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
      {remove.error && <Failure error={remove.error} />}
    </>
  );
}
function MemoryEditor({
  memory,
  twinId,
  close,
}: {
  memory: Memory | null;
  twinId: string;
  close: () => void;
}) {
  const [content, setContent] = useState(memory?.content || '');
  const [tags, setTags] = useState(memory?.tags || '');
  const client = useQueryClient();
  const { notify } = useApp();
  const save = useMutation({
    mutationFn: () => api.saveMemory({ personality_id: twinId, content, tags }, memory?.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['memories'] });
      notify('A little more context, saved.');
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
        <DialogTitle>{memory ? 'Refine a memory' : 'Something worth remembering'}</DialogTitle>
        <DialogContent className="form-stack">
          {save.error && <Alert severity="error">{errorMessage(save.error)}</Alert>}
          <TextField
            label="What should your twin remember?"
            autoFocus
            multiline
            minRows={5}
            required
            slotProps={{ htmlInput: { maxLength: 4000 } }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <TextField
            label="Tags"
            placeholder="preferences, work, goals"
            helperText="Separate tags with commas. Memory content is sent to Gemini to make it searchable."
            slotProps={{ htmlInput: { maxLength: 200 } }}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={save.isPending} onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={save.isPending}>
            {save.isPending ? 'Saving memory…' : 'Save memory'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
