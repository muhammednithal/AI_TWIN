import { dateLabel } from '../../lib/format';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  MessageSquare,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useApp } from '../../app/context';
import { useSessions, useTwins } from '../../lib/queries';
import { AvatarMark, Empty, Failure, Loading, PageTitle } from '../../components/ui';
export function Dashboard() {
  const { auth } = useApp();
  const twins = useTwins();
  const sessions = useSessions();
  if (twins.isPending || sessions.isPending) return <Loading />;
  if (twins.error || sessions.error)
    return (
      <Failure
        error={twins.error || sessions.error}
        retry={() => {
          twins.refetch();
          sessions.refetch();
        }}
      />
    );
  const name = auth?.user.display_name.split(' ')[0] || 'there';
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE SPACE FOR YOUR MIND"
        title={`Good to see you, ${name}.`}
        description="Pick up a thought. Explore a new one. Your twin is here for it."
        action={
          <span className="date-chip">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        }
      />
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span className="tiny-dot" />
            THINK OUT LOUD
          </span>
          <h2>
            Your perspective.
            <br />
            <em>A fresh possibility.</em>
          </h2>
          <p>
            A sounding board that knows your voice, remembers what matters, and helps you move
            forward.
          </p>
          <Button
            component={Link}
            to={twins.data.length ? '/chat' : '/twins?create=1'}
            variant="contained"
            endIcon={<ArrowUpRight size={17} />}
          >
            {twins.data.length ? 'Start a conversation' : 'Create your first twin'}
          </Button>
          <span className="hero-caption">A good thought starts with a conversation.</span>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-a" />
          <div className="art-orbit orbit-b" />
          <div className="art-orbit orbit-c" />
          <div className="art-sphere sphere-back" />
          <div className="art-sphere sphere-front">
            <Sparkles size={42} strokeWidth={1} />
          </div>
          <div className="art-bubble bubble-a">Your voice, reflected.</div>
          <div className="art-bubble bubble-b">
            <span className="tiny-dot" />A new way to see it.
          </div>
          <span className="art-star star-a">✳</span>
          <span className="art-star star-b">✦</span>
        </div>
      </section>
      <div className="stats-grid">
        <Link to="/twins" className="stat-card">
          <span className="stat-icon sage">
            <Users size={20} />
          </span>
          <div>
            <span>YOUR TWINS</span>
            <strong>{twins.data.length.toString().padStart(2, '0')}</strong>
          </div>
          <ArrowUpRight size={17} />
        </Link>
        <Link to="/chat" className="stat-card">
          <span className="stat-icon peach">
            <MessageSquare size={20} />
          </span>
          <div>
            <span>SAVED CONVERSATIONS</span>
            <strong>{sessions.data.length.toString().padStart(2, '0')}</strong>
          </div>
          <ArrowUpRight size={17} />
        </Link>
        <Link to="/memory" className="stat-card">
          <span className="stat-icon lavender">
            <Brain size={20} />
          </span>
          <div>
            <span>YOUR CONTEXT</span>
            <strong className="stat-text">Made personal</strong>
          </div>
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="dashboard-columns">
        <section>
          <div className="section-heading">
            <h2>
              Your twins <span>{twins.data.length}</span>
            </h2>
            <Link to="/twins">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {!twins.data.length ? (
            <Empty
              title="Every twin starts with you."
              description="Share a few writing samples and give your twin a purpose."
              to="/twins?create=1"
              label="Create a twin"
            />
          ) : (
            <div className="twin-preview-grid">
              {twins.data.slice(0, 2).map((t, i) => (
                <Link to={`/chat?twin=${t.id}`} className="twin-preview" key={t.id}>
                  <div className="card-top">
                    <AvatarMark name={t.name} index={i} large />
                    <span className="subtle-badge">PERSONAL TWIN</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.style_summary || 'Your voice. Your point of view. Ready when you are.'}</p>
                  <div className="card-bottom">
                    <span>{t.samples.length} writing samples</span>
                    <span className="round-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                </Link>
              ))}
              <Link className="create-twin-card" to="/twins?create=1">
                <Plus size={22} />
                <strong>A new side of you</strong>
                <span>Create another twin</span>
              </Link>
            </div>
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>Recent conversations</h2>
            <Link to="/chat">
              See all <ArrowRight size={15} />
            </Link>
          </div>
          <div className="conversation-list">
            {!sessions.data.length ? (
              <div className="small-empty">
                <MessageSquare size={27} />
                <h3>A blank page, in a good way.</h3>
                <p>Your next good idea could start here.</p>
                <Link to="/chat">
                  Let’s talk <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              sessions.data.slice(0, 4).map((s) => (
                <Link key={s.id} to={`/chat/${s.id}`} className="conversation-row">
                  <span className="conversation-icon">
                    <MessageSquare size={17} />
                  </span>
                  <div>
                    <strong>{s.title}</strong>
                    <small>
                      {twins.data.find((t) => t.id === s.personality_id)?.name || 'Your twin'} ·{' '}
                      {dateLabel(s.updated_at)}
                    </small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))
            )}
          </div>
          <div className="thought-note">
            <span>✦</span>
            <div>
              <strong>Better context. Better conversations.</strong>
              <p>A preference, a goal, a small detail. Add what makes you, you.</p>
              <Link to="/memory">
                Add a memory <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </div>
      <footer className="page-footer">
        <span>
          <span className="tiny-dot" />A private space to be a little more you.
        </span>
        <span>Built around your perspective.</span>
      </footer>
    </>
  );
}
