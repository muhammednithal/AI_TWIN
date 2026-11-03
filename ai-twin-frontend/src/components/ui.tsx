import type { ReactNode } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <CircularProgress size={25} />
      <span>Opening your workspace…</span>
    </div>
  );
}
export function Failure({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        retry && (
          <Button color="inherit" onClick={retry}>
            Retry
          </Button>
        )
      }
    >
      {error instanceof Error ? error.message : 'Could not load this view.'}
    </Alert>
  );
}
export function Empty({
  title,
  description,
  to,
  label,
}: {
  title: string;
  description: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Sparkles size={24} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {to && (
        <Button component={Link} to={to} variant="contained" endIcon={<ArrowUpRight size={16} />}>
          {label}
        </Button>
      )}
    </div>
  );
}
export function Confirm({
  open,
  title,
  description,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  busy: boolean;
  error?: unknown;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <p>{description}</p>
        {!!error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error instanceof Error ? error.message : 'Could not delete. Please try again.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export function AvatarMark({
  name,
  index = 0,
  large = false,
}: {
  name: string;
  index?: number;
  large?: boolean;
}) {
  return (
    <span className={`avatar-mark tone-${index % 4} ${large ? 'large' : ''}`}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
