import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workbench } from '../../lib/workbench';
import { errorMessage } from '../../lib/api';
import { useApp } from '../../app/context';
import type { Decision, DecisionInput } from '../../lib/workbench-types';
export function DecisionEditor({
  projectId,
  decision,
  initial,
  close,
}: {
  projectId: string;
  decision?: Decision;
  initial?: Partial<DecisionInput>;
  close: () => void;
}) {
  const [value, setValue] = useState<DecisionInput>({
    title: decision?.title || initial?.title || '',
    task_id: decision?.task_id || initial?.task_id,
    choice: decision?.choice || '',
    reasoning: decision?.reasoning || '',
    assumptions: decision?.assumptions || '',
    outcome: decision?.outcome || '',
    status: decision?.status || 'considering',
    review_on: decision?.review_on || '',
  });
  const client = useQueryClient();
  const { notify } = useApp();
  const save = useMutation({
    mutationFn: () => workbench.saveDecision(projectId, value, decision?.id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['decisions'] });
      notify('Decision journal updated.');
      close();
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
          {decision ? 'Revisit your decision' : 'Leave a trail of your thinking'}
          <p className="dialog-subtitle">
            Record your choice and reasoning. Return later to capture what happened.
          </p>
        </DialogTitle>
        <DialogContent className="form-stack">
          {save.error && <Alert severity="error">{errorMessage(save.error)}</Alert>}
          <TextField
            label="Decision title"
            required
            autoFocus
            value={value.title}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
          <TextField
            label="Status"
            select
            value={value.status}
            onChange={(e) =>
              setValue({ ...value, status: e.target.value as DecisionInput['status'] })
            }
          >
            {['considering', 'decided', 'closed'].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="What are you considering or choosing?"
            required
            multiline
            minRows={3}
            value={value.choice}
            onChange={(e) => setValue({ ...value, choice: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
            helperText="Your decision—not an action executed by the assistant."
          />
          <TextField
            label="Why?"
            multiline
            minRows={3}
            value={value.reasoning}
            onChange={(e) => setValue({ ...value, reasoning: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
          />
          <TextField
            label="Assumptions & uncertainties"
            multiline
            minRows={2}
            value={value.assumptions}
            onChange={(e) => setValue({ ...value, assumptions: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
          />
          <TextField
            label="What actually happened?"
            multiline
            minRows={3}
            value={value.outcome}
            onChange={(e) => setValue({ ...value, outcome: e.target.value })}
            slotProps={{ htmlInput: { maxLength: 4000 } }}
            placeholder="Return after the decision to record results and lessons."
          />
          <TextField
            label="Review on"
            type="date"
            value={value.review_on}
            onChange={(e) => setValue({ ...value, review_on: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save journal entry'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
