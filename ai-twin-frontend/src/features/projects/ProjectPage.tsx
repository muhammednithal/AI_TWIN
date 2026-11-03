import { useState } from 'react';
import { Alert, Button, Tab, Tabs } from '@mui/material';
import { Archive, ArchiveRestore, ArrowLeft, Pencil } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Failure, Loading, PageTitle } from '../../components/ui';
import { useProjectMemories, workbench } from '../../lib/workbench';
import { ProjectEditor } from './ProjectEditor';
import { ProjectMemories } from './ProjectMemories';
import { TaskStudio } from '../tasks/TaskStudio';
import { DecisionJournal } from '../decisions/Journal';
export function ProjectPage() {
  const { id } = useParams();
  return <ProjectWorkspace key={id} id={id!} />;
}
function ProjectWorkspace({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['project', id], queryFn: () => workbench.project(id) });
  const memories = useProjectMemories(id);
  const [editing, setEditing] = useState(false);
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const tab = ['memories', 'tasks', 'journal', 'about'].includes(params.get('tab') || '')
    ? params.get('tab')!
    : 'memories';
  const archive = useMutation({
    mutationFn: () =>
      workbench.saveProject({ ...query.data!, archived: !query.data!.archived }, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['project', id] });
      client.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  if (query.isPending) return <Loading />;
  if (query.error) return <Failure error={query.error} retry={() => query.refetch()} />;
  const project = query.data;
  return (
    <>
      <Link className="back-link" to="/projects">
        <ArrowLeft size={14} />
        All projects
      </Link>
      <PageTitle
        eyebrow="YOUR CONTEXT, PUT TO WORK"
        title={project.name}
        description={project.purpose || 'Save useful context and turn it into a reviewable result.'}
        action={
          <div className="project-header-actions">
            <Button startIcon={<Pencil size={15} />} onClick={() => setEditing(true)}>
              Edit brief
            </Button>
            <Button
              startIcon={project.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
              disabled={archive.isPending}
              onClick={() => archive.mutate()}
            >
              {project.archived ? 'Restore' : 'Archive'}
            </Button>
          </div>
        }
      />
      {archive.error && <Failure error={archive.error} />}
      {project.archived && (
        <Alert severity="info">
          This project is archived. Its memories, task results, and journal remain available.
          Restore it to add or change project content.
        </Alert>
      )}
      <Tabs
        value={tab}
        onChange={(_, value) => setParams({ tab: value })}
        variant="scrollable"
        scrollButtons="auto"
        className="project-tabs"
        aria-label="Project sections"
      >
        <Tab
          label={`Memories${memories.data ? ` · ${memories.data.filter((m) => !m.archived).length}` : ''}`}
          value="memories"
          id="project-tab-memories"
          aria-controls="project-panel-memories"
        />
        <Tab
          label="Task studio"
          value="tasks"
          id="project-tab-tasks"
          aria-controls="project-panel-tasks"
        />
        <Tab
          label="Decision journal"
          value="journal"
          id="project-tab-journal"
          aria-controls="project-panel-journal"
        />
        <Tab
          label="How this works"
          value="about"
          id="project-tab-about"
          aria-controls="project-panel-about"
        />
      </Tabs>
      <div
        className="project-tab-content"
        role="tabpanel"
        id={`project-panel-${tab}`}
        aria-labelledby={`project-tab-${tab}`}
        tabIndex={0}
      >
        {tab === 'memories' || tab === 'tasks' ? (
          memories.isPending ? (
            <Loading />
          ) : memories.error ? (
            <Failure error={memories.error} retry={() => memories.refetch()} />
          ) : tab === 'memories' ? (
            <ProjectMemories project={project} memories={memories.data} />
          ) : (
            <TaskStudio project={project} memories={memories.data} />
          )
        ) : tab === 'journal' ? (
          <DecisionJournal project={project} />
        ) : (
          <section className="project-guide">
            <div className="eyebrow">FROM MEMORY TO MEANINGFUL PROGRESS</div>
            <h2>A workspace that carries your context forward.</h2>
            <ol>
              <li>
                <strong>Save what matters.</strong>
                <p>
                  Add facts, preferences, research, instructions, or past decisions. Record sources
                  and a review date when helpful.
                </p>
              </li>
              <li>
                <strong>Choose the context.</strong>
                <p>
                  Select memories for a task. Pinned constraints and standing project instructions
                  are always included. Preview the exact context before sending it to the AI.
                </p>
              </li>
              <li>
                <strong>Review the result.</strong>
                <p>
                  Analyze, compare, plan, or draft. Results keep an immutable copy of their context,
                  even when memories change later.
                </p>
              </li>
              <li>
                <strong>Close the loop.</strong>
                <p>
                  Record your decision, why it made sense, and what happened. Save useful lessons
                  back to memory only when you choose to.
                </p>
              </li>
            </ol>
            {project.instructions && (
              <div className="project-instructions">
                <strong>Your standing instructions</strong>
                <p>{project.instructions}</p>
              </div>
            )}
            <Alert severity="info">
              This version works from your saved material. It has no live browsing, current market
              feed, or external action tools.
            </Alert>
          </section>
        )}
      </div>
      {editing && <ProjectEditor project={project} close={() => setEditing(false)} />}
    </>
  );
}
