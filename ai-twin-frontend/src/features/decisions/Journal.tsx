import { useState } from 'react';
import { Button, Chip, MenuItem, TextField } from '@mui/material';
import { ArrowUpRight, BookOpen, Brain, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Empty, Failure, Loading, PageTitle } from '../../components/ui';
import { dueForReview, useDecisions, useProjects } from '../../lib/workbench';
import { dateLabel } from '../../lib/format';
import type { Decision, Project } from '../../lib/workbench-types';
import { DecisionEditor } from './DecisionEditor';
import { ProjectMemoryEditor } from '../projects/ProjectMemories';
export function DecisionJournal({ project }: { project?: Project }) {
  const query = useDecisions(project?.id);
  const projects = useProjects();
  const [editing, setEditing] = useState<Decision | 'new' | null>(null);
  const [lesson, setLesson] = useState<Decision | null>(null);
  const [status, setStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const filtered =
    query.data?.filter(
      (d) =>
        (status === 'all' || d.status === status) &&
        (project || selectedProject === 'all' || d.project_id === selectedProject),
    ) || [];
  const owner =
    editing && editing !== 'new'
      ? projects.data?.find((p) => p.id === editing.project_id)
      : project;
  return (
    <>
      {!project && (
        <PageTitle
          eyebrow="REMEMBER WHY. LEARN WHAT HAPPENED."
          title="Your decision journal."
          description="Keep your reasoning, assumptions, and outcomes together. A useful history of how you think."
          action={
            <Button component={Link} to="/projects" endIcon={<ArrowUpRight size={16} />}>
              Choose a project
            </Button>
          }
        />
      )}
      <div className="section-heading">
        <h2>{project ? 'Decisions, with a little perspective.' : 'Recent entries'}</h2>
        {project && (
          <Button
            startIcon={<Plus size={16} />}
            variant="contained"
            disabled={project.archived}
            onClick={() => setEditing('new')}
          >
            Record a decision
          </Button>
        )}
      </div>
      <div className="journal-filters">
        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['all', 'considering', 'decided', 'closed'].map((s) => (
            <MenuItem key={s} value={s}>
              {s === 'all' ? 'All statuses' : s}
            </MenuItem>
          ))}
        </TextField>
        {!project && (
          <TextField
            select
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <MenuItem value="all">All projects</MenuItem>
            {projects.data?.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => query.refetch()} />
      ) : !filtered.length ? (
        <Empty
          title="A place for your next decision."
          description="Record what you chose, why it made sense, and the assumptions you want to revisit."
        />
      ) : (
        <div className="decision-list">
          {filtered.map((d) => (
            <article key={d.id} className="decision-card">
              <div className="card-top">
                <div className="decision-heading">
                  <BookOpen size={20} />
                  <div>
                    <h3>{d.title}</h3>
                    <small>
                      {projects.data?.find((p) => p.id === d.project_id)?.name || project?.name} ·{' '}
                      {dateLabel(d.updated_at)}
                    </small>
                  </div>
                </div>
                <div className="decision-actions">
                  <Chip size="small" label={d.status} />
                  <Button
                    size="small"
                    startIcon={<Pencil size={14} />}
                    disabled={
                      projects.data?.find((p) => p.id === d.project_id)?.archived ??
                      project?.archived ??
                      true
                    }
                    onClick={() => setEditing(d)}
                  >
                    Revisit
                  </Button>
                </div>
              </div>
              <p className="decision-choice">{d.choice}</p>
              {d.reasoning && (
                <details>
                  <summary>Reasoning & assumptions</summary>
                  <p>{d.reasoning}</p>
                  {d.assumptions && <p className="muted-block">Assumptions: {d.assumptions}</p>}
                </details>
              )}
              {d.outcome && (
                <div className="decision-outcome">
                  <strong>What happened</strong>
                  <p>{d.outcome}</p>
                </div>
              )}
              <div className="decision-footer">
                {d.review_on && (
                  <span
                    className={
                      dueForReview(d.review_on) && d.status !== 'closed' ? 'review-due' : ''
                    }
                  >
                    {dueForReview(d.review_on) && d.status !== 'closed' ? 'Review due' : 'Review'} ·{' '}
                    {d.review_on}
                  </span>
                )}
                {d.task_id && (
                  <Link to={`/projects/${d.project_id}?tab=tasks&task=${d.task_id}`}>
                    View supporting task <ArrowUpRight size={14} />
                  </Link>
                )}
                <Button
                  size="small"
                  startIcon={<Brain size={14} />}
                  disabled={
                    projects.data?.find((p) => p.id === d.project_id)?.archived ??
                    project?.archived ??
                    true
                  }
                  onClick={() => setLesson(d)}
                >
                  Save a lesson
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && owner && (
        <DecisionEditor
          projectId={owner.id}
          decision={editing === 'new' ? undefined : editing}
          close={() => setEditing(null)}
        />
      )}
      {lesson && (
        <ProjectMemoryEditor
          projectId={lesson.project_id}
          initial={{
            title: lesson.title,
            kind: 'decision',
            content: [
              lesson.choice,
              lesson.reasoning && `Reasoning: ${lesson.reasoning}`,
              lesson.assumptions && `Assumptions: ${lesson.assumptions}`,
              lesson.outcome && `Outcome: ${lesson.outcome}`,
            ]
              .filter(Boolean)
              .join('\n\n')
              .slice(0, 4000),
            source: `Decision journal · ${lesson.id}`,
          }}
          close={() => setLesson(null)}
        />
      )}
    </>
  );
}
