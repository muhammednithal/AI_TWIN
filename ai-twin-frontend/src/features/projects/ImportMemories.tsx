import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemories, useTwins } from '../../lib/queries';
import { memoryKinds, workbench } from '../../lib/workbench';
import { errorMessage } from '../../lib/api';
import { useApp } from '../../app/context';
import { Failure, Loading } from '../../components/ui';
export function ImportMemories({ projectId, close }: { projectId: string; close: () => void }) {
  const twins = useTwins();
  const [selectedTwin, setSelectedTwin] = useState('');
  const twinId = selectedTwin || twins.data?.[0]?.id || '';
  const memories = useMemories(twinId);
  const [ids, setIds] = useState<string[]>([]);
  const [kind, setKind] = useState('fact');
  const client = useQueryClient();
  const { notify } = useApp();
  const save = useMutation({
    mutationFn: () => workbench.importTwinMemories(projectId, twinId, ids, kind),
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: ['project-memories', projectId] });
      client.invalidateQueries({ queryKey: ['projects'] });
      notify(
        `Imported ${result.imported} memories. ${result.already_present_or_empty} already present or empty.`,
      );
      close();
    },
  });
  return (
    <Dialog open onClose={save.isPending ? undefined : close} maxWidth="sm" fullWidth>
      <DialogTitle>
        Bring useful context forward
        <p className="dialog-subtitle">
          Copy selected twin memories into this project. Originals stay where they are; repeated
          imports keep existing project copies.
        </p>
      </DialogTitle>
      <DialogContent className="form-stack">
        {twins.isPending ? (
          <Loading />
        ) : twins.error ? (
          <Failure error={twins.error} />
        ) : !twins.data.length ? (
          <Alert severity="info">
            No twins yet. You can add project memories directly without creating a twin.
          </Alert>
        ) : (
          <>
            <TextField
              select
              label="From twin"
              value={twinId}
              disabled={save.isPending}
              onChange={(e) => {
                setSelectedTwin(e.target.value);
                setIds([]);
              }}
            >
              {twins.data.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Import as"
              value={kind}
              disabled={save.isPending}
              onChange={(e) => setKind(e.target.value)}
            >
              {memoryKinds.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </TextField>
            {memories.isPending ? (
              <Loading />
            ) : memories.error ? (
              <Failure error={memories.error} />
            ) : !memories.data.length ? (
              <Alert severity="info">This twin has no saved memories.</Alert>
            ) : (
              <div className="import-memory-list">
                {memories.data.map((m) => (
                  <label className="context-pick" key={m.id}>
                    <Checkbox
                      checked={ids.includes(m.id)}
                      disabled={save.isPending || (!ids.includes(m.id) && ids.length >= 30)}
                      onChange={(_, checked) =>
                        setIds(checked ? [...ids, m.id] : ids.filter((id) => id !== m.id))
                      }
                    />
                    <div>
                      <p>{m.content}</p>
                      <small>{m.tags}</small>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </>
        )}
        {save.error && <Alert severity="error">{errorMessage(save.error)}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={save.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!ids.length || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Importing…' : `Import ${ids.length} memories`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
