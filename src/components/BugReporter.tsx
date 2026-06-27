'use client';

import { apiUrl } from '@/lib/apiUrl';
import { useCallback, useState } from 'react';

/**
 * BugReporter — Floating bug report button + modal.
 * Captures: title, description, current page URL, priority.
 * Submits to /api/bugs (already built).
 */

export function BugReporter() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/bugs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          page: window.location.pathname,
          priority,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setTitle('');
          setDescription('');
          setPriority('MEDIUM');
        }, 2000);
      }
    } catch (e) {
      console.error('Bug report failed:', e);
    } finally {
      setSubmitting(false);
    }
  }, [title, description, priority]);

  return (
    <>
      {/* Floating bug button — top-right, CR-style gradient */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-3 z-[100] flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-base shadow-lg transition-all hover:scale-110 hover:shadow-[0_6px_28px_rgba(255,0,128,0.5)]"
        style={{ background: 'linear-gradient(135deg, #ff0080 0%, #7928ca 100%)', boxShadow: '0 4px 20px rgba(255,0,128,0.3)' }}
        title="Report a bug"
      >
        🐛
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border/30 p-5"
            style={{ background: '#12121a' }}
          >
            {submitted ? (
              <div className="py-8 text-center">
                <p className="text-2xl">✅</p>
                <p className="mt-2 text-sm font-semibold text-emerald-400">Bug reported. Thank you!</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Report a Bug</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    What went wrong?
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Post text box overflowed when pasting long text"
                    className="w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Details — what were you doing?
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Steps to reproduce, what you expected, what happened instead..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          priority === p
                            ? p === 'CRITICAL'
                              ? 'border-red-500 bg-red-500/20 text-red-400'
                              : p === 'HIGH'
                                ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                                : p === 'MEDIUM'
                                  ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                                  : 'border-blue-500 bg-blue-500/20 text-blue-400'
                            : 'border-border/30 text-muted-foreground/60 hover:border-border/60'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/40">
                    Page: {typeof window !== 'undefined' ? window.location.pathname : ''}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !description.trim() || submitting}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-40"
                  >
                    {submitting ? 'Sending...' : 'Submit Bug'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
