export type AutonomyMode = 'manual' | 'safe_autopilot' | 'full_autopilot';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type AgentName =
  | 'marketing_manager'
  | 'seo_strategist'
  | 'content_writer'
  | 'editor'
  | 'social_media_manager'
  | 'analytics_agent'
  | 'safety_compliance';

export type MarketingAction =
  | 'crawl_site'
  | 'generate_keyword_roadmap'
  | 'generate_blog_draft'
  | 'repurpose_social_posts'
  | 'schedule_social_draft'
  | 'publish_social_post'
  | 'write_website_patch'
  | 'delete_content'
  | 'generate_weekly_report'
  | 'postiz_push_draft';

export type ApprovalThreshold = {
  action: MarketingAction;
  requiresApprovalAt: RiskLevel;
};

export type BrandVoiceSettings = {
  brandName: string;
  positioning: string;
  voice: string;
  bannedClaims: string[];
  preferredPhrases: string[];
  avoidedPhrases: string[];
};

export type AutonomyPolicy = {
  mode: AutonomyMode;
  emergencyStop: boolean;
  allowedActions: MarketingAction[];
  blockedActions: MarketingAction[];
  approvalThresholds: ApprovalThreshold[];
  maxPostsPerDay: number;
  maxBlogPostsPerWeek: number;
  platformsEnabled: string[];
  brandVoice: BrandVoiceSettings;
  targetAudience: string[];
  targetCountries: string[];
  websiteUrl: string;
  competitorUrls: string[];
};

export type PolicyDecision = {
  allowed: boolean;
  approvalRequired: boolean;
  reason: string;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  agent: AgentName;
  action: MarketingAction;
  inputSummary: string;
  outputSummary: string;
  riskLevel: RiskLevel;
  approvalRequired: boolean;
  status: 'started' | 'success' | 'failed' | 'blocked';
};

export type SeoIssue = {
  id: string;
  url: string;
  category: 'technical' | 'metadata' | 'content' | 'links' | 'schema' | 'performance';
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  detail: string;
  recommendation: string;
};

export type CrawledPage = {
  url: string;
  status: number;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string[];
  h2: string[];
  wordCount: number;
  images: Array<{ src: string; alt: string }>;
  links: Array<{ href: string; text: string; internal: boolean }>;
  schemaTypes: string[];
  loadMs: number;
};

export type SiteAudit = {
  id: string;
  createdAt: string;
  websiteUrl: string;
  pages: CrawledPage[];
  issues: SeoIssue[];
  summary: {
    pagesCrawled: number;
    high: number;
    medium: number;
    low: number;
    score: number;
  };
};

export type KeywordIdea = {
  keyword: string;
  clusterId: string;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  opportunityScore: number;
  difficulty: {
    score: number;
    basis: 'heuristic' | 'estimated' | 'provider';
    explanation: string;
  };
  demand: {
    score: number;
    basis: 'search-console-page-signal' | 'intent-proxy' | 'provider';
    explanation: string;
  };
  rationale: string;
};

export type KeywordCluster = {
  id: string;
  name: string;
  intent: KeywordIdea['intent'];
  keywords: KeywordIdea[];
  recommendedFormat: 'blog' | 'landing_page' | 'comparison' | 'tool' | 'faq';
  priority: 'high' | 'medium' | 'low';
};

export type KeywordRoadmap = {
  id: string;
  createdAt: string;
  seed: string;
  clusters: KeywordCluster[];
  calendar: Array<{
    day: number;
    keyword: string;
    format: KeywordCluster['recommendedFormat'];
    title: string;
  }>;
};

export type BlogDraft = {
  id: string;
  createdAt: string;
  targetKeyword: string;
  searchIntent: KeywordIdea['intent'];
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  outline: string[];
  intro: string;
  sections: Array<{ heading: string; body: string }>;
  faq: Array<{ question: string; answer: string }>;
  internalLinks: Array<{ anchor: string; url: string }>;
  externalSourceSuggestions: string[];
  schemaRecommendation: string;
  cta: string;
  reviewStatus: 'draft' | 'needs_review' | 'approved';
  validation: ContentValidation;
};

export type ContentValidation = {
  riskLevel: RiskLevel;
  issues: string[];
  claimsToVerify: string[];
  approvalRequired: boolean;
};

export type SocialPost = {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube_shorts' | 'linkedin' | 'x' | 'threads';
  draftId: string;
  content: string;
  hook: string;
  hashtags: string[];
  mediaDirection: string;
  scheduledFor?: string;
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'failed';
  characterCount: number;
};

export type SocialCalendar = {
  id: string;
  createdAt: string;
  sourceDraftId: string;
  posts: SocialPost[];
};

export type WeeklyReport = {
  id: string;
  createdAt: string;
  publishedSummary: string;
  wins: string[];
  misses: string[];
  nextKeywords: string[];
  nextPosts: string[];
  seoIssues: SeoIssue[];
  growthOpportunities: string[];
};

export type DashboardIndex = {
  updatedAt: string;
  latestAudit?: SiteAudit;
  latestRoadmap?: KeywordRoadmap;
  latestDraft?: BlogDraft;
  latestCalendar?: SocialCalendar;
  latestReport?: WeeklyReport;
  recentLogs: AuditLogEntry[];
};
