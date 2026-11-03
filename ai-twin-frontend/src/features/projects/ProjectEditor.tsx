import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { workbench } from '../../lib/workbench';
import { errorMessage } from '../../lib/api';
import { useApp } from '../../app/context';
import type { Project, ProjectInput } from '../../lib/workbench-types';

export function ProjectEditor({
  project,
  preset,
  close,
}: {
  project?: Project;
  preset?: Partial<ProjectInput>;
  close: () => void;
}) {
  const [value, setValue] = useState<ProjectInput>({
    name: project?.name || preset?.name || '',
    purpose: project?.purpose || preset?.purpose || '',
    instructions: project?.instructions || '',
    archived: project?.archived || false,
  });
  const client = useQueryClient();
  const navigate = useNavigate();
  const { notify } = useApp();
  const save = useMutation({
    mutationFn: () => workbench.saveProject(value, project?.id),
    onSuccess: ({ project: saved }) => {
      client.invalidateQueries({ queryKey: ['projects'] });
      client.invalidateQueries({ queryKey: ['project', saved.id] });
      notify('Project saved.');
      close();
      if (!project) navigate(`/projects/${saved.id}`);
    },
  });
  return (
    <Dialog open onClose={save.isPending ? undefined : close} fullWidth maxWidth="sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!save.isPending) save.mutate();
        }}
      >
        <DialogTitle>
          {project ? 'Refine your project' : 'Give your context a home'}
          <p className="dialog-subtitle">
            A topic, a goal, or a decision you want to think through over time.
          </p>
        </DialogTitle>
        <DialogContent className="form-stack">
          {save.error && <Alert severity="error">{errorMessage(save.error)}</Alert>}
          <TextField
            autoFocus
            required
            label="Project name"
            value={value.name}
            onChange={(e) => setValue({ ...value, name: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField
            label="Purpose & goals"
            multiline
            minRows={3}
            value={value.purpose}
            onChange={(e) => setValue({ ...value, purpose: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 3000 } }}
            placeholder="What are you working toward? What does a useful result look like?"
          />
          <TextField
            label="Standing instructions"
            multiline
            minRows={3}
            value={value.instructions}
            onChange={(e) => setValue({ ...value, instructions: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
            helperText="Always included in task context. For example: distinguish evidence from assumptions and show missing information."
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={save.isPending} onClick={close}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
