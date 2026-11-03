import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import { ArrowRight, ArrowUpRight, Brain, FolderOpen, NotebookPen, Sparkles } from 'lucide-react';
import { PageTitle, Empty, Failure, Loading } from '../../components/ui';
import { useApp } from '../../app/context';
import {
  useDecisions,
  useProjects,
  useTasks,
  dueForReview,
  statusLabel,
} from '../../lib/workbench';
import { dateLabel } from '../../lib/format';
export function WorkbenchHome() {
  const { auth } = useApp();
  const projects = useProjects();
  const tasks = useTasks();
  const decisions = useDecisions();
  if (projects.isPending || tasks.isPending || decisions.isPending) return <Loading />;
  if (projects.error || tasks.error || decisions.error)
    return (
      <Failure
        error={projects.error || tasks.error || decisions.error}
        retry={() => {
          projects.refetch();
          tasks.refetch();
          decisions.refetch();
        }}
      />
    );
  const active = projects.data.filter((p) => !p.archived);
  const review = tasks.data.filter((t) => t.status === 'needs_review');
  const due = decisions.data.filter((d) => d.status !== 'closed' && dueForReview(d.review_on));
  return (
    <>
      <PageTitle
        eyebrow="A PERSONAL DECISION WORKSPACE"
        title={`Make room for what’s next, ${auth?.user.display_name.split(' ')[0] || 'you'}.`}
        description="Keep your context. Put it to work. Learn from what happens."
        action={
          <Button
            component={Link}
            to="/projects"
            variant="contained"
            endIcon={<ArrowUpRight size={16} />}
          >
            Open your projects
          </Button>
        }
      />
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span className="tiny-dot" />
            FROM MEMORY TO MOMENTUM
          </span>
          <h2>
            Remember what matters.
            <br />
            <em>Decide with perspective.</em>
          </h2>
          <p>
            A workspace that connects your research, preferences, and past reasoning to the next
            useful task.
          </p>
          <Button
            component={Link}
            to={active[0] ? `/projects/${active[0].id}?tab=tasks` : '/projects'}
            variant="contained"
            endIcon={<ArrowRight size={16} />}
          >
            {active.length ? 'Start a task with context' : 'Create your first project'}
          </Button>
          <span className="hero-caption">
            Your knowledge, your choices, a little more continuity.
          </span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-a" />
          <div className="art-orbit orbit-b" />
          <div className="art-sphere sphere-back" />
          <div className="art-sphere sphere-front">
            <Sparkles size={42} strokeWidth={1} />
          </div>
          <div className="art-bubble bubble-a">Context you can inspect.</div>
          <div className="art-bubble bubble-b">
            <span className="tiny-dot" />A result you can review.
          </div>
        </div>
      </section>
      <div className="stats-grid">
        <Link to="/projects" className="stat-card">
          <span className="stat-icon sage">
            <FolderOpen size={20} />
          </span>
          <div>
            <span>ACTIVE PROJECTS</span>
            <strong>{active.length.toString().padStart(2, '0')}</strong>
          </div>
          <ArrowUpRight size={17} />
        </Link>
        <Link to="/projects" className="stat-card">
          <span className="stat-icon peach">
            <Brain size={20} />
          </span>
          <div>
            <span>ACTIVE PROJECT MEMORIES</span>
            <strong>
              {active
                .reduce((count, p) => count + p.memory_count, 0)
                .toString()
                .padStart(2, '0')}
            </strong>
          </div>
          <ArrowUpRight size={17} />
        </Link>
        <Link to="/journal" className="stat-card">
          <span className="stat-icon lavender">
            <NotebookPen size={20} />
          </span>
          <div>
            <span>JOURNAL REVIEWS DUE*</span>
            <strong>{due.length.toString().padStart(2, '0')}</strong>
          </div>
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="dashboard-columns">
        <section>
          <div className="section-heading">
            <h2>Your projects</h2>
            <Link to="/projects">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {!active.length ? (
            <Empty
              title="Give your knowledge a purpose."
              description="Start with a goal or recurring decision. Add context, then put it to work."
              to="/projects"
              label="Explore projects"
            />
          ) : (
            <div className="home-projects">
              {active.slice(0, 4).map((p) => (
                <Link to={`/projects/${p.id}`} className="home-project" key={p.id}>
                  <span className="stat-icon sage">
                    <FolderOpen size={20} />
                  </span>
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.purpose || 'A space for useful context and considered decisions.'}</p>
                    <small>
                      {p.memory_count} memories · {p.task_count} tasks
                    </small>
                  </div>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          )}
          <div className="thought-note">
            <span>✦</span>
            <div>
              <strong>The useful part is what comes after.</strong>
              <p>
                Record a decision and return later to note what happened. That is how context
                becomes experience.
              </p>
              <Link to="/journal">
                Open your journal <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
        <section>
          <div className="section-heading">
            <h2>Recent task results</h2>
            <span className="muted">{review.length} awaiting review*</span>
          </div>
          <div className="conversation-list">
            {!tasks.data.length ? (
              <div className="small-empty">
                <Brain size={27} />
                <h3>Context, ready for a question.</h3>
                <p>Analyze, compare, plan, or draft using the memories you choose.</p>
              </div>
            ) : (
              tasks.data.slice(0, 5).map((t) => (
                <Link
                  className="conversation-row"
                  key={t.id}
                  to={`/projects/${t.project_id}?tab=tasks&task=${t.id}`}
                >
                  <span className="conversation-icon">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <strong>{t.objective}</strong>
                    <small>
                      {projects.data.find((p) => p.id === t.project_id)?.name} ·{' '}
                      {statusLabel(t.status)} · {dateLabel(t.created_at)}
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            )}
          </div>
          <div className="workflow-strip">
            <span>
              01 <strong>Remember</strong>
            </span>
            <ArrowRight size={13} />
            <span>
              02 <strong>Apply</strong>
            </span>
            <ArrowRight size={13} />
            <span>
              03 <strong>Reflect</strong>
            </span>
          </div>
        </section>
      </div>
      <footer className="page-footer">
        <span>
          <span className="tiny-dot" />
          Your context stays under your control.
        </span>
        <span>*Review counts cover the latest 200 tasks / journal entries.</span>
      </footer>
    </>
  );
}
