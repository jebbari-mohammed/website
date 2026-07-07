import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, CalendarDays, FileText, Globe2, Search, Share2 } from 'lucide-react';
import type { DashboardIndex } from '../../../packages/core/src/types';

const emptyIndex: DashboardIndex = {
  updatedAt: '',
  recentLogs: [],
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-textSecondary">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-white/10 py-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MarketingDashboard() {
  const [data, setData] = useState<DashboardIndex>(emptyIndex);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading');

  useEffect(() => {
    fetch('/marketing-data/index.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('missing');
        return response.json() as Promise<DashboardIndex>;
      })
      .then((index) => {
        setData(index);
        setStatus('ready');
      })
      .catch(() => {
        setStatus('empty');
      });
  }, []);

  const issueCount = useMemo(() => data.latestAudit?.issues.length || 0, [data.latestAudit]);

  return (
    <main className="min-h-screen bg-[#070908] px-4 py-5 text-textPrimary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Autonomous Marketing Employee</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Marketing Control Room</h1>
          </div>
          <div className="text-sm text-textSecondary">
            {status === 'ready' ? `Updated ${new Date(data.updatedAt).toLocaleString()}` : 'Run a CLI command to generate local data.'}
          </div>
        </div>

        {status === 'empty' ? (
          <div className="mt-6 border border-white/10 bg-white/[0.03] p-5 text-sm text-textSecondary">
            No generated marketing data yet. Start with <code className="text-white">pnpm audit:site</code>, then{' '}
            <code className="text-white">pnpm keywords:generate</code>.
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="SEO Score" value={data.latestAudit?.summary.score ?? '-'} />
          <Stat label="Pages Crawled" value={data.latestAudit?.summary.pagesCrawled ?? '-'} />
          <Stat label="Open Issues" value={issueCount || '-'} />
          <Stat label="Social Drafts" value={data.latestCalendar?.posts.length ?? '-'} />
        </div>

        <Section title="Website Audit" icon={<Globe2 size={18} />}>
          {data.latestAudit ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {data.latestAudit.issues.slice(0, 9).map((issue) => (
                <div key={issue.id} className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-textSecondary">
                    <AlertTriangle size={14} />
                    {issue.severity} / {issue.category}
                  </div>
                  <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-textSecondary">{issue.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textSecondary">No audit generated.</p>
          )}
        </Section>

        <Section title="Keyword Roadmap" icon={<Search size={18} />}>
          {data.latestRoadmap ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.latestRoadmap.calendar.slice(0, 8).map((item) => (
                <div key={`${item.day}-${item.keyword}`} className="flex items-start gap-3 border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-sm font-semibold text-white">{item.day}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-textSecondary">{item.format}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textSecondary">No roadmap generated.</p>
          )}
        </Section>

        <Section title="Latest Blog Draft" icon={<FileText size={18} />}>
          {data.latestDraft ? (
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.14em] text-textSecondary">{data.latestDraft.targetKeyword}</div>
              <h3 className="mt-2 text-xl font-semibold text-white">{data.latestDraft.title}</h3>
              <p className="mt-2 max-w-3xl text-sm text-textSecondary">{data.latestDraft.metaDescription}</p>
              <div className="mt-4 text-sm text-textSecondary">
                Review: <span className="text-white">{data.latestDraft.reviewStatus}</span> / Risk:{' '}
                <span className="text-white">{data.latestDraft.validation.riskLevel}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-textSecondary">No blog draft generated.</p>
          )}
        </Section>

        <Section title="Social Calendar" icon={<Share2 size={18} />}>
          {data.latestCalendar ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.latestCalendar.posts.map((post) => (
                <div key={post.id} className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-primary">{post.platform}</div>
                  <p className="line-clamp-5 text-sm text-textSecondary">{post.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textSecondary">No social calendar generated.</p>
          )}
        </Section>

        <Section title="Weekly Report & Logs" icon={<CalendarDays size={18} />}>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-semibold text-white">Latest Report</h3>
              <p className="mt-2 text-sm text-textSecondary">{data.latestReport?.publishedSummary || 'No weekly report generated.'}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Activity size={16} />
                Audit Trail
              </div>
              <div className="space-y-2">
                {data.recentLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="text-xs text-textSecondary">
                    <span className="text-white">{log.agent}</span> / {log.action} / {log.status}
                  </div>
                ))}
                {data.recentLogs.length === 0 ? <p className="text-sm text-textSecondary">No actions logged yet.</p> : null}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}

export default MarketingDashboard;
