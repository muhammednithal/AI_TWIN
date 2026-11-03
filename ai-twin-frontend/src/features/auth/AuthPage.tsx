import { useState } from 'react';
import { Alert, Button, InputAdornment, IconButton, TextField } from '@mui/material';
import { ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck, Brain, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage, storeAuth } from '../../lib/api';
export function AuthPage({ register = false }: { register?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      storeAuth(await (register ? api.signup(email, password, name) : api.login(email, password)));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link className="brand" to="/login">
          <span className="brand-symbol">
            <Sparkles size={22} />
          </span>
          twin.
        </Link>
        <div className="auth-story-content">
          <span className="pill">YOUR MIND, WITH A LITTLE MORE ROOM</span>
          <h1>
            A space to think.
            <br />
            Context that stays with you.
          </h1>
          <p>
            Connect your research, preferences, and past decisions to your next useful task.
            Remember what matters and learn from what happens.
          </p>
          <div className="auth-orbit">
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-center">
              <Sparkles size={46} strokeWidth={1.2} />
            </div>
            <span className="orbit-label label-one">
              <Brain size={16} />
              Your context
            </span>
            <span className="orbit-label label-two">
              <MessageSquare size={16} />
              Your next step
            </span>
            <span className="orbit-dot" />
          </div>
          <div className="auth-trust">
            <ShieldCheck size={18} />
            <span>Your workspace. Your memories. Your control.</span>
          </div>
        </div>
        <small>A little more clarity. A little more you.</small>
      </section>
      <section className="auth-form">
        <div className="form-wrap">
          <div className="eyebrow">LET’S MAKE ROOM FOR YOU</div>
          <h2>{register ? 'Meet your other mind.' : 'Welcome back.'}</h2>
          <p>
            {register
              ? 'Create a workspace for your context, tasks, and decisions.'
              : 'Your projects, memories, and decisions, right where you left them.'}
          </p>
          <form onSubmit={submit}>
            {error && <Alert severity="error">{error}</Alert>}
            {register && (
              <TextField
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                slotProps={{ htmlInput: { maxLength: 80 } }}
              />
            )}
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <TextField
              label="Password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={register ? 'new-password' : 'current-password'}
              helperText={register ? 'At least 10 characters. Make it yours.' : undefined}
              slotProps={{
                htmlInput: { minLength: register ? 10 : undefined, maxLength: 72 },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={show ? 'Hide password' : 'Show password'}
                        onClick={() => setShow(!show)}
                        edge="end"
                      >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              size="large"
              variant="contained"
              disabled={busy}
              endIcon={<ArrowRight size={18} />}
            >
              {busy
                ? 'Opening your workspace…'
                : register
                  ? 'Create your workspace'
                  : 'Step inside'}
            </Button>
          </form>
          <p className="auth-switch">
            {register ? 'Already have a workspace?' : 'New around here?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Make yourself at home'}
            </Link>
          </p>
          <div className="auth-footnote">AI can make mistakes. You decide what to remember.</div>
        </div>
      </section>
    </div>
  );
}
