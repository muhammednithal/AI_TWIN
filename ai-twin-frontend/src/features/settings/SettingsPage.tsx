import { useState } from 'react';
import { Alert, Button, Switch } from '@mui/material';
import { ArrowDownToLine, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';
import { PageTitle } from '../../components/ui';
import { useApp } from '../../app/context';
import { api, download, errorMessage, storeAuth } from '../../lib/api';
export function SettingsPage() {
  const { auth, mode, toggleMode, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function exportData() {
    setBusy(true);
    setError('');
    try {
      const data = await api.export();
      download(
        `twin-workspace-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(data, null, 2),
      );
      notify('Your workspace export is ready.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your space. Your settings."
        description="A few simple controls to make this workspace yours."
      />
      <div className="settings-layout">
        <section className="settings-card">
          <div className="section-heading">
            <h2>Your account</h2>
            <ShieldCheck size={20} />
          </div>
          <div className="profile-block">
            <div className="user-avatar large">{auth?.user.display_name.slice(0, 1)}</div>
            <div>
              <h3>{auth?.user.display_name}</h3>
              <p>{auth?.user.email}</p>
            </div>
            <span className="subtle-badge">PERSONAL WORKSPACE</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Appearance</strong>
              <p>A quieter workspace, day or night.</p>
            </div>
            <div className="switch-label">
              {mode === 'dark' ? 'Dark' : 'Light'}
              <Switch
                checked={mode === 'dark'}
                onChange={toggleMode}
                slotProps={{ input: { 'aria-label': 'Dark mode' } }}
              />
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Sign out</strong>
              <p>End this session on this browser tab.</p>
            </div>
            <Button variant="outlined" onClick={() => storeAuth(null)}>
              Sign out
            </Button>
          </div>
        </section>
        <section className="settings-card">
          <div className="section-heading">
            <h2>Your data belongs to you.</h2>
            <LockKeyhole size={19} />
          </div>
          <p className="settings-description">
            Download your projects, typed memories, task results and context snapshots, decision
            journal, twins, and conversations as a JSON file. Embedding vectors and credentials are
            excluded.
          </p>
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            variant="contained"
            startIcon={<ArrowDownToLine size={17} />}
            disabled={busy}
            onClick={exportData}
          >
            {busy ? 'Preparing your export…' : 'Export my workspace'}
          </Button>
          <div className="privacy-note">
            <ShieldCheck size={19} />
            <p>
              Project memories are stored without AI processing. A task sends only the project
              brief, objective, and previewed context to Gemini when you run it. Twin chat
              separately uses writing-sample embeddings and recent conversation context. Nothing is
              silently promoted into project memory.
            </p>
          </div>
        </section>
        <section className="settings-card">
          <h2>A reflection, with perspective.</h2>
          <p className="settings-description">
            Your twin is an AI companion, not a person. Its responses can be incomplete or
            inaccurate. Review important details and avoid sharing information you do not want
            processed by the AI provider.
          </p>
          <a
            className="text-link"
            href="https://ai.google.dev/gemini-api/terms"
            target="_blank"
            rel="noreferrer"
          >
            Gemini API terms <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </>
  );
}
