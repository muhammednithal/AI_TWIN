import { useState } from 'react';
import { Button, Chip, MenuItem, TextField } from '@mui/material';
import { ArrowUpRight, FolderOpen, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Empty, Failure, Loading, PageTitle } from '../../components/ui';
import { useProjects } from '../../lib/workbench';
import { ProjectEditor } from './ProjectEditor';
import type { ProjectInput } from '../../lib/workbench-types';

const presets = [
  {
    name: 'Investment research',
    purpose:
      'Keep my investment criteria, research, and past reasoning together. Evaluate supplied information, identify what needs fresh verification, and record decisions and outcomes.',
  },
  {
    name: 'Build something useful',
    purpose:
      'Organize product ideas, user research, constraints, and decisions. Turn the context into practical plans and learn from the results.',
  },
  {
    name: 'Learning & growth',
    purpose:
      'Remember my goals, learning preferences, and progress. Use them to make realistic plans and reflect on what works.',
  },
];
export function ProjectsPage() {
  const query = useProjects();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [editor, setEditor] = useState<Partial<ProjectInput> | null>(null);
  const visible =
    query.data?.filter(
      (p) =>
        (status === 'all' || p.archived === (status === 'archived')) &&
        `${p.name} ${p.purpose}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageTitle
        eyebrow="CONTEXT WITH A PURPOSE"
        title="Your projects."
        description="A home for what you know, what you’re working on, and what comes next."
        action={
          <Button variant="contained" startIcon={<Plus size={17} />} onClick={() => setEditor({})}>
            New project
          </Button>
        }
      />
      <div className="toolbar project-toolbar">
        <TextField
          placeholder="Find a project…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: { startAdornment: <Search size={17} className="search-icon" /> },
            htmlInput: { 'aria-label': 'Find a project' },
          }}
        />
        <TextField
          select
          label="Show"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ maxWidth: 160 }}
        >
          {['active', 'archived', 'all'].map((s) => (
            <MenuItem key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </MenuItem>
          ))}
        </TextField>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : !visible.length ? (
        <div className="empty">
          <FolderOpen size={28} />
          <h2>
            {query.data.length ? 'No matching projects.' : 'Start with something that matters.'}
          </h2>
          <p>
            {query.data.length
              ? 'Try another search or include archived projects.'
              : 'Give your memories a purpose, then use them to think through your next task.'}
          </p>
          {!query.data.length && (
            <Button variant="contained" onClick={() => setEditor({})}>
              Create a project
            </Button>
          )}
        </div>
      ) : (
        <div className="project-grid">
          {visible.map((p) => (
            <Link className="project-card" to={`/projects/${p.id}`} key={p.id}>
              <div className="card-top">
                <span className="stat-icon sage">
                  <FolderOpen size={21} />
                </span>
                {p.archived ? <Chip label="Archived" size="small" /> : <ArrowUpRight size={18} />}
              </div>
              <h2>{p.name}</h2>
              <p>{p.purpose || 'A space to collect useful context and turn it into progress.'}</p>
              <div className="project-card-stats">
                <span>{p.memory_count} memories</span>
                <span>{p.task_count} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <section className="starter-section">
        <div className="eyebrow">START WITH A REAL WORKFLOW</div>
        <h2>Make room for a useful question.</h2>
        <div className="presets">
          {presets.map((p) => (
            <button key={p.name} onClick={() => setEditor(p)}>
              <span>✦</span>
              <h3>{p.name}</h3>
              <p>{p.purpose}</p>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </div>
      </section>
      <Empty
        title="A decision workspace, not just a chat history."
        description="Save context once. Choose what to use. Review the result. Record what happened."
      />
      {editor && <ProjectEditor preset={editor} close={() => setEditor(null)} />}
    </>
  );
}
