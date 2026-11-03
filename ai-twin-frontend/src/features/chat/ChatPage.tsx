import { dateLabel } from '../../lib/format';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  Copy,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AvatarMark, Confirm, Empty, Failure, Loading } from '../../components/ui';
import { api, download, errorMessage } from '../../lib/api';
import { useSessions, useTwins } from '../../lib/queries';
import { useApp } from '../../app/context';
import type { Message, Session, Source } from '../../lib/types';
const starters = [
  {
    title: 'Find the right words',
    text: 'Help me write a thoughtful message in my own voice. Ask me who it is for and what I want to say.',
  },
  {
    title: 'Untangle an idea',
    text: 'I have an idea I would like to explore. Help me think it through by asking a few good questions.',
  },
  {
    title: 'Make a little progress',
    text: 'Help me turn one of my goals into a small, achievable plan for this week. Ask me about the goal first.',
  },
];
export function ChatPage() {
  const { id } = useParams();
  return <ChatWorkspace key={id || 'new'} id={id} />;
}
function ChatWorkspace({ id }: { id?: string }) {
  const twins = useTwins();
  const sessions = useSessions();
  const [params] = useSearchParams();
  const [chosen, setChosen] = useState(params.get('twin') || '');
  const session = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.session(id!),
    enabled: !!id,
  });
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState('');
  const [optimistic, setOptimistic] = useState<Message[]>([]);
  const client = useQueryClient();
  const navigate = useNavigate();
  const { notify } = useApp();
  const bottom = useRef<HTMLDivElement>(null);
  const flight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const twinId = id
    ? session.data?.personality_id || ''
    : twins.data?.some((t) => t.id === chosen)
      ? chosen
      : twins.data?.[0]?.id || '';
  const twin = twins.data?.find((t) => t.id === twinId);
  const messages = [...(session.data?.messages || []), ...optimistic];
  const send = useMutation({
    mutationFn: (text: string) => api.chat(twinId, text, id),
    onSuccess: (result) => {
      client.setQueryData(['session', result.session_id], (prev: Session | undefined) => ({
        ...prev,
        id: result.session_id,
        title: prev?.title || input,
        personality_id: twinId,
        updated_at: new Date().toISOString(),
        messages: [...(prev?.messages || []), ...result.messages],
      }));
      setOptimistic([]);
      setInput('');
      client.invalidateQueries({ queryKey: ['sessions'] });
      if (!id && mounted.current) navigate(`/chat/${result.session_id}`, { replace: true });
    },
    onError: () => setOptimistic([]),
    onSettled: () => {
      flight.current = false;
    },
  });
  function submit(text = input) {
    if (flight.current || !text.trim() || !twinId) return;
    flight.current = true;
    setInput(text);
    setOptimistic([
      {
        id: 'pending',
        from_user: true,
        content: text.trim(),
        created_at: new Date().toISOString(),
      },
    ]);
    send.mutate(text.trim());
  }
  const remove = useMutation({
    mutationFn: (key: string) => api.deleteSession(key),
    onSuccess: (_, key) => {
      client.removeQueries({ queryKey: ['session', key] });
      client.invalidateQueries({ queryKey: ['sessions'] });
      setDeleting(null);
      if (key === id) navigate('/chat');
      notify('Conversation deleted.');
    },
  });
  const rename = useMutation({
    mutationFn: () => api.renameSession(id!, title),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['sessions'] });
      client.invalidateQueries({ queryKey: ['session', id] });
      setRenaming(false);
      notify('Conversation renamed.');
    },
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, send.isPending]);
  if (twins.isPending) return <Loading />;
  if (twins.error) return <Failure error={twins.error} retry={() => twins.refetch()} />;
  if (!twins.data.length)
    return (
      <Empty
        title="Your next conversation starts with a twin."
        description="Create a twin with a little of your voice and perspective."
        to="/twins?create=1"
        label="Create your twin"
      />
    );
  return (
    <div className="chat-layout">
      <aside className="chat-history">
        <div className="section-heading">
          <h3>Conversations</h3>
          <IconButton component={Link} to="/chat" aria-label="New conversation">
            <Plus size={18} />
          </IconButton>
        </div>
        <TextField
          placeholder="Find a conversation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <Search size={16} className="search-icon" /> } }}
        />
        <div className="history-items">
          {sessions.error && <Failure error={sessions.error} retry={() => sessions.refetch()} />}
          {sessions.data
            ?.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
            .map((s) => (
              <div className={`history-item ${s.id === id ? 'selected' : ''}`} key={s.id}>
                <Link to={`/chat/${s.id}`}>
                  <MessageSquare size={16} />
                  <div>
                    <strong>{s.title}</strong>
                    <small>{dateLabel(s.updated_at)}</small>
                  </div>
                </Link>
                <IconButton
                  size="small"
                  aria-label={`Delete ${s.title}`}
                  onClick={() => setDeleting(s)}
                >
                  <Trash2 size={14} />
                </IconButton>
              </div>
            ))}
          {!sessions.data?.length && (
            <p className="history-empty">
              A home for your
              <br />
              thoughts, as they unfold.
            </p>
          )}
        </div>
      </aside>
      <section className="chat-panel">
        <div className="mobile-conversation-picker">
          <TextField
            select
            label="Browse conversations"
            value={id || ''}
            onChange={(e) => navigate(e.target.value ? `/chat/${e.target.value}` : '/chat')}
            disabled={send.isPending}
          >
            <MenuItem value="">New conversation</MenuItem>
            {sessions.data?.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.title}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <header className="chat-header">
          <div className="chat-twin">
            <AvatarMark name={twin?.name || 'T'} />
            <div>
              <strong>{session.data?.title || 'A fresh conversation'}</strong>
              <small>
                {twin?.name || 'Your twin'} <span>· Personal AI</span>
              </small>
            </div>
          </div>
          <div className="chat-tools">
            {id ? (
              <>
                <Tooltip title="Rename conversation">
                  <IconButton
                    aria-label="Rename conversation"
                    onClick={() => {
                      setTitle(session.data?.title || '');
                      setRenaming(true);
                    }}
                  >
                    <Pencil size={17} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export as Markdown">
                  <IconButton
                    aria-label="Export conversation"
                    disabled={!session.data}
                    onClick={() =>
                      download(
                        'twin-conversation.md',
                        `# ${session.data?.title}\n\n${messages.map((m) => `## ${m.from_user ? 'You' : twin?.name || 'Twin'}\n\n${m.content}`).join('\n\n')}`,
                        'text/markdown',
                      )
                    }
                  >
                    <ArrowDownToLine size={18} />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <TextField
                select
                value={twinId}
                onChange={(e) => {
                  setChosen(e.target.value);
                  send.reset();
                }}
                disabled={send.isPending}
                aria-label="Choose your twin"
                sx={{ minWidth: 140 }}
              >
                {twins.data.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </div>
        </header>
        <div className="chat-messages" aria-live="polite">
          {id && session.isPending ? (
            <Loading />
          ) : session.error ? (
            <Failure error={session.error} retry={() => session.refetch()} />
          ) : (
            <>
              {!messages.length && (
                <div className="chat-welcome">
                  <div className="welcome-symbol">
                    <Sparkles size={33} strokeWidth={1.3} />
                  </div>
                  <span className="eyebrow">A THOUGHT PARTNER, IN YOUR CORNER</span>
                  <h1>What’s on your mind?</h1>
                  <p>
                    Big ideas, small decisions, or finding the right words.
                    <br />
                    Think it through with {twin?.name}.
                  </p>
                  <div className="starter-prompts">
                    {starters.map((s) => (
                      <button
                        key={s.title}
                        disabled={send.isPending}
                        onClick={() => submit(s.text)}
                      >
                        <span>{s.title}</span>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} twinName={twin?.name || 'Twin'} />
              ))}
              {send.isPending && (
                <div className="thinking">
                  <Sparkles size={17} />
                  <span>{twin?.name} is thinking</span>
                  <CircularProgress size={12} />
                </div>
              )}
            </>
          )}
          <div ref={bottom} />
        </div>
        <div className="composer-area">
          {send.error && (
            <Alert severity="error" onClose={() => send.reset()}>
              {errorMessage(send.error)} Your draft is still here.
            </Alert>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`A thought, a question, a little context…`}
              aria-label="Message your twin"
              maxLength={12000}
              disabled={send.isPending || !!session.error || (!!id && session.isPending)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <div className="composer-footer">
              <span>
                <span className="tiny-dot" />
                {twin?.name}{' '}
                <span className="composer-limit">· {input.length.toLocaleString()}/12,000</span>
              </span>
              <IconButton
                type="submit"
                aria-label="Send message"
                disabled={
                  send.isPending || !input.trim() || !!session.error || (!!id && session.isPending)
                }
                className="send-button"
              >
                {send.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <ArrowUp size={20} />
                )}
              </IconButton>
            </div>
          </form>
          <p className="composer-note">
            A reflection of your perspective, powered by AI. Always use your own judgment.
          </p>
        </div>
      </section>
      <Confirm
        open={!!deleting}
        title="Delete this conversation?"
        description="This permanently deletes the conversation and all of its messages."
        busy={remove.isPending}
        error={remove.error}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
      <Dialog
        open={renaming}
        onClose={() => !rename.isPending && setRenaming(false)}
        maxWidth="xs"
        fullWidth
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!rename.isPending) rename.mutate();
          }}
        >
          <DialogTitle>A name for this thought</DialogTitle>
          <DialogContent className="form-stack">
            {rename.error && <Failure error={rename.error} />}
            <TextField
              autoFocus
              label="Conversation title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRenaming(false)} disabled={rename.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={rename.isPending}>
              Save title
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {remove.error && <Failure error={remove.error} />}
    </div>
  );
}
function MessageBubble({ message, twinName }: { message: Message; twinName: string }) {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const { notify } = useApp();
  const sources: Source[] = message.metadata?.sources || [];
  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
    } catch {
      notify('Select the message text to copy it.');
    }
  }
  return (
    <article className={`message ${message.from_user ? 'user-message' : 'twin-message'}`}>
      <div className="message-avatar">{message.from_user ? 'Y' : <Sparkles size={17} />}</div>
      <div className="message-body">
        <div className="message-label">
          {message.from_user ? 'You' : twinName}
          <time>
            {new Date(message.created_at).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
        <div className="markdown">
          <Markdown
            disallowedElements={['img']}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </Markdown>
        </div>
        {!message.from_user && (
          <div className="message-actions">
            <Tooltip title={copied ? 'Copied' : 'Copy response'}>
              <IconButton size="small" aria-label="Copy response" onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </IconButton>
            </Tooltip>
            {!!sources.length && (
              <button
                className="source-toggle"
                onClick={() => setSourcesOpen(!sourcesOpen)}
                aria-expanded={sourcesOpen}
              >
                <BookOpen size={13} />
                {sources.length} context references
              </button>
            )}
          </div>
        )}
        {sourcesOpen && (
          <div className="context-sources">
            <small>Retrieved context, not a guarantee that every reference was used.</small>
            {sources.map((s) => (
              <div key={s.id}>
                <span>{s.kind === 'memory' ? 'Memory' : 'Writing sample'}</span>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
