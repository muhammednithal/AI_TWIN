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
  Slider,
  TextField,
  Tooltip,
} from '@mui/material';
import { ArrowUpRight, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AvatarMark, Confirm, Empty, Failure, Loading, PageTitle } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useTwins } from '../../lib/queries';
import type { Twin, TwinInput } from '../../lib/types';
import { useApp } from '../../app/context';
const blank: TwinInput = {
  name: '',
  language: 'English',
  style_summary: '',
  sliders: { humor: 0.5, formality: 0.5, empathy: 0.7 },
  samples: [{ text: '' }],
};
const presets = [
  {
    name: 'Everyday me',
    description: 'A familiar sounding board for life and ideas.',
    style: 'Warm, natural, and thoughtful. Help me think clearly while staying true to my voice.',
  },
  {
    name: 'Creative partner',
    description: 'Find a fresh angle. Make something yours.',
    style:
      'Curious, imaginative, and encouraging. Offer unexpected angles and practical ways to develop ideas.',
  },
  {
    name: 'Work mode',
    description: 'Clearer writing and more focused decisions.',
    style:
      'Clear, concise, and professional. Help me draft messages, weigh decisions, and turn plans into next steps.',
  },
];
export function TwinsPage() {
  const query = useTwins();
  const client = useQueryClient();
  const { notify } = useApp();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Twin | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Twin | null>(null);
  const [search, setSearch] = useState('');
  const show = open || params.has('create');
  const close = () => {
    setOpen(false);
    setEditing(null);
    setParams({});
  };
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTwin(id),
    onSuccess: () => {
      client.invalidateQueries();
      setDeleting(null);
      notify('Twin and its workspace data deleted.');
    },
  });
  return (
    <>
      <PageTitle
        eyebrow="DIFFERENT SIDES. STILL YOU."
        title="Your personal twins."
        description="Give each twin a purpose, a voice, and a little of your perspective."
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={17} />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Create a twin
          </Button>
        }
      />
      <div className="toolbar">
        <TextField
          placeholder="Find a twin…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <Search size={17} className="search-icon" /> } }}
        />
        <span>{query.data?.length || 0} twins in your workspace</span>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : !query.data.length ? (
        <Empty
          title="Meet a new side of yourself."
          description="Start with a purpose, then share writing samples so your twin can learn your voice."
          to="/twins?create=1"
          label="Create your first twin"
        />
      ) : (
        <div className="twins-grid">
          {query.data
            .filter((t) =>
              `${t.name} ${t.style_summary}`.toLowerCase().includes(search.toLowerCase()),
            )
            .map((t, i) => (
              <article className="twin-preview" key={t.id}>
                <div className="card-top">
                  <AvatarMark name={t.name} index={i} large />
                  <div>
                    <Tooltip title="Edit twin">
                      <IconButton
                        aria-label={`Edit ${t.name}`}
                        onClick={() => {
                          setEditing(t);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete twin">
                      <IconButton aria-label={`Delete ${t.name}`} onClick={() => setDeleting(t)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
                <h2>{t.name}</h2>
                <p>{t.style_summary || 'Ready to bring your perspective to the conversation.'}</p>
                <div className="tag-row">
                  <span>{t.language}</span>
                  <span>{t.samples.length} samples</span>
                </div>
                <Button
                  component={Link}
                  to={`/chat?twin=${t.id}`}
                  variant="outlined"
                  endIcon={<ArrowUpRight size={16} />}
                >
                  Start a conversation
                </Button>
              </article>
            ))}
        </div>
      )}
      <section className="starter-section">
        <div className="eyebrow">A STARTING POINT, NOT A BOX</div>
        <h2>What could your twin help with?</h2>
        <div className="presets">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setEditing({
                  ...blank,
                  id: '',
                  name: p.name,
                  style_summary: p.style,
                  created_at: '',
                  updated_at: '',
                });
                setOpen(true);
              }}
            >
              <span>✦</span>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </section>
      {show && (
        <TwinEditor key={editing?.id || editing?.name || 'new'} twin={editing} close={close} />
      )}
      <Confirm
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        description="This permanently deletes this twin, its memories, and its conversations. Export your workspace in Settings first if you need a copy."
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
function TwinEditor({ twin, close }: { twin: Twin | null; close: () => void }) {
  const [value, setValue] = useState<TwinInput>(() =>
    twin
      ? {
          name: twin.name,
          language: twin.language,
          style_summary: twin.style_summary,
          sliders: {
            humor: twin.sliders?.humor ?? 0.5,
            formality: twin.sliders?.formality ?? 0.5,
            empathy: twin.sliders?.empathy ?? twin.sliders?.emotional ?? 0.7,
          },
          samples: twin.samples.map((s) => ({ text: s.text })),
        }
      : structuredClone(blank),
  );
  const client = useQueryClient();
  const { notify } = useApp();
  const mutation = useMutation({
    mutationFn: () => api.saveTwin(value, twin?.id || undefined),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['twins'] });
      notify(twin?.id ? 'Your twin has a fresh perspective.' : 'Your twin is ready. Say hello.');
      close();
    },
  });
  return (
    <Dialog open onClose={mutation.isPending ? undefined : close} maxWidth="sm" fullWidth>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!mutation.isPending) mutation.mutate();
        }}
      >
        <DialogTitle>
          {twin?.id ? 'Refine your twin' : 'A new side of you'}
          <p className="dialog-subtitle">Make it personal. You can always refine this later.</p>
        </DialogTitle>
        <DialogContent className="form-stack">
          {mutation.error && <Alert severity="error">{errorMessage(mutation.error)}</Alert>}
          <TextField
            label="Twin name"
            value={value.name}
            required
            slotProps={{ htmlInput: { maxLength: 80 } }}
            onChange={(e) => setValue({ ...value, name: e.target.value })}
          />
          <TextField
            label="Language"
            select
            value={value.language}
            onChange={(e) => setValue({ ...value, language: e.target.value })}
          >
            {[
              'English',
              'Malayalam',
              'Hindi',
              'Arabic',
              'Spanish',
              'French',
              ...(!['English', 'Malayalam', 'Hindi', 'Arabic', 'Spanish', 'French'].includes(
                value.language,
              )
                ? [value.language]
                : []),
            ].map((l) => (
              <MenuItem key={l} value={l}>
                {l}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Purpose & personality"
            multiline
            minRows={3}
            value={value.style_summary}
            slotProps={{ htmlInput: { maxLength: 2000 } }}
            placeholder="What should this twin help you with? How should it sound?"
            onChange={(e) => setValue({ ...value, style_summary: e.target.value })}
          />
          <div className="field-section">
            <h3>Find your tone</h3>
            {Object.entries(value.sliders)
              .filter(([key]) => ['humor', 'formality', 'empathy'].includes(key))
              .map(([key, val]) => (
                <div className="tone-slider" key={key}>
                  <div>
                    <label id={`slider-${key}`}>{key}</label>
                    <span>{Math.round(val * 100)}%</span>
                  </div>
                  <Slider
                    aria-labelledby={`slider-${key}`}
                    min={0}
                    max={1}
                    step={0.1}
                    value={val}
                    onChange={(_, v) =>
                      setValue({ ...value, sliders: { ...value.sliders, [key]: v as number } })
                    }
                  />
                </div>
              ))}
          </div>
          <div className="field-section">
            <h3>Your voice, in your words</h3>
            <p>
              Paste something you wrote: a message, a note, or a short story. Only include content
              you want sent to Gemini for learning your style.
            </p>
            {value.samples.map((sample, index) => (
              <div className="sample-input" key={index}>
                <TextField
                  label={`Writing sample ${index + 1}`}
                  required
                  multiline
                  minRows={3}
                  value={sample.text}
                  slotProps={{ htmlInput: { maxLength: 4000 } }}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      samples: value.samples.map((s, i) =>
                        i === index ? { text: e.target.value } : s,
                      ),
                    })
                  }
                />
                {value.samples.length > 1 && (
                  <IconButton
                    aria-label={`Remove sample ${index + 1}`}
                    onClick={() =>
                      setValue({ ...value, samples: value.samples.filter((_, i) => i !== index) })
                    }
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </div>
            ))}
            <Button
              startIcon={<Plus size={16} />}
              disabled={value.samples.length >= 10}
              onClick={() => setValue({ ...value, samples: [...value.samples, { text: '' }] })}
            >
              Add a writing sample
            </Button>
          </div>
        </DialogContent>
        <DialogActions>
          <Button disabled={mutation.isPending} onClick={close}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Learning your voice…'
              : twin?.id
                ? 'Save changes'
                : 'Create twin'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
