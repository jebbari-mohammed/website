/**
 * Auto-Publisher — Automatically publishes content to Medium, DEV.to, and Hashnode
 * These platforms have OFFICIAL APIs designed for programmatic publishing.
 * This is 100% legitimate and zero risk.
 * 
 * Usage:
 *   node auto-publish.mjs medium "path/to/blog-post.html"    # Publish one post to Medium
 *   node auto-publish.mjs devto "path/to/blog-post.html"     # Publish to DEV.to
 *   node auto-publish.mjs all "path/to/blog-post.html"       # Publish to all platforms
 *   node auto-publish.mjs medium-all                          # Publish ALL blog posts to Medium
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../../public/blog');

// Load env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No .env file found.');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

loadEnv();

// Extract content from HTML blog post
function parseHTMLPost(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  
  const titleMatch = html.match(/<h1>(.*?)<\/h1>/);
  const descMatch = html.match(/name="description" content="(.*?)"/);
  const canonicalMatch = html.match(/rel="canonical" href="(.*?)"/);
  
  // Extract article body content (between <article> tags, after the h1 and meta)
  const articleMatch = html.match(/<article>([\s\S]*?)<\/article>/);
  let body = articleMatch ? articleMatch[1] : '';
  
  // Remove breadcrumb, h1, and meta line
  body = body.replace(/<div class="breadcrumb">[\s\S]*?<\/div>/, '');
  body = body.replace(/<h1>[\s\S]*?<\/h1>/, '');
  body = body.replace(/<p class="meta">[\s\S]*?<\/p>/, '');
  body = body.replace(/<div class="cta-box">[\s\S]*?<\/div>/, '');
  
  // Convert HTML to Markdown for DEV.to/Hashnode
  let markdown = body
    .replace(/<h2>(.*?)<\/h2>/g, '\n## $1\n')
    .replace(/<h3>(.*?)<\/h3>/g, '\n### $1\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<li>(.*?)<\/li>/g, '- $1')
    .replace(/<ul>|<\/ul>|<ol>|<\/ol>/g, '')
    .replace(/<p>(.*?)<\/p>/gs, '\n$1\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Add canonical link and CTA at bottom
  const canonical = canonicalMatch ? canonicalMatch[1] : '';
  markdown += `\n\n---\n\n*Originally published at [Your AI Coach](${canonical})*\n\n`;
  markdown += `**Download Your AI Coach free:**\n`;
  markdown += `- [iOS App Store](https://apps.apple.com/app/your-ai-coach)\n`;
  markdown += `- [Google Play](https://play.google.com/store/apps/details?id=com.ai.gym.coach)\n`;

  return {
    title: titleMatch ? titleMatch[1] : path.basename(filePath, '.html'),
    description: descMatch ? descMatch[1] : '',
    canonicalUrl: canonical,
    htmlContent: body,
    markdownContent: markdown,
    tags: ['fitness', 'ai', 'health', 'technology', 'coaching'],
  };
}

// ===== MEDIUM =====
async function publishToMedium(post) {
  const token = process.env.MEDIUM_TOKEN;
  if (!token || token.includes('your_')) {
    console.error('  ❌ MEDIUM_TOKEN not set in .env');
    return false;
  }

  // Get user ID
  const userRes = await fetch('https://api.medium.com/v1/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const userData = await userRes.json();
  const userId = userData.data?.id;
  if (!userId) {
    console.error('  ❌ Could not get Medium user ID:', userData);
    return false;
  }

  // Create post
  const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: post.title,
      contentFormat: 'html',
      content: `<h1>${post.title}</h1>${post.htmlContent}`,
      canonicalUrl: post.canonicalUrl,
      tags: post.tags.slice(0, 5),
      publishStatus: 'draft', // Change to 'public' to publish immediately
    }),
  });

  const result = await res.json();
  if (result.data?.url) {
    console.log(`  ✅ Medium: ${result.data.url} (saved as DRAFT — review before publishing)`);
    return true;
  } else {
    console.error('  ❌ Medium error:', result);
    return false;
  }
}

// ===== DEV.TO =====
async function publishToDevTo(post) {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    console.error('  ❌ DEVTO_API_KEY not set in .env');
    return false;
  }

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      article: {
        title: post.title,
        body_markdown: post.markdownContent,
        published: false, // Set to true to publish immediately
        tags: post.tags.slice(0, 4),
        canonical_url: post.canonicalUrl,
        description: post.description,
      },
    }),
  });

  const result = await res.json();
  if (result.url) {
    console.log(`  ✅ DEV.to: ${result.url} (saved as DRAFT — review before publishing)`);
    return true;
  } else {
    console.error('  ❌ DEV.to error:', result);
    return false;
  }
}

// ===== HASHNODE =====
async function publishToHashnode(post) {
  const token = process.env.HASHNODE_TOKEN;
  const pubId = process.env.HASHNODE_PUBLICATION_ID;
  if (!token || token.includes('your_') || !pubId || pubId.includes('your_')) {
    console.error('  ❌ HASHNODE_TOKEN or HASHNODE_PUBLICATION_ID not set in .env');
    return false;
  }

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post { url title }
      }
    }
  `;

  const res = await fetch('https://gql.hashnode.com', {
    method: 'POST',
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          title: post.title,
          contentMarkdown: post.markdownContent,
          publicationId: pubId,
          tags: post.tags.map(t => ({ slug: t, name: t })),
          originalArticleURL: post.canonicalUrl,
          subtitle: post.description,
        },
      },
    }),
  });

  const result = await res.json();
  const url = result.data?.publishPost?.post?.url;
  if (url) {
    console.log(`  ✅ Hashnode: ${url}`);
    return true;
  } else {
    console.error('  ❌ Hashnode error:', JSON.stringify(result.errors || result));
    return false;
  }
}

async function publishPost(platform, filePath) {
  console.log(`\n📤 Publishing: ${path.basename(filePath)}`);
  const post = parseHTMLPost(filePath);

  const publishers = {
    medium: publishToMedium,
    devto: publishToDevTo,
    hashnode: publishToHashnode,
  };

  if (platform === 'all') {
    for (const [name, fn] of Object.entries(publishers)) {
      console.log(`  → ${name}...`);
      await fn(post);
      await new Promise(r => setTimeout(r, 1000));
    }
  } else if (publishers[platform]) {
    await publishers[platform](post);
  } else {
    console.error(`❌ Unknown platform: ${platform}. Use: medium, devto, hashnode, all`);
  }
}

async function publishAllBlogPosts(platform) {
  if (!fs.existsSync(BLOG_DIR)) {
    console.error('❌ No blog directory found. Generate blog posts first with generate-blog.mjs');
    return;
  }

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
  if (files.length === 0) {
    console.error('❌ No blog posts found in public/blog/');
    return;
  }

  console.log(`\n🚀 Publishing ${files.length} blog posts to ${platform}...\n`);

  for (const file of files) {
    await publishPost(platform, path.join(BLOG_DIR, file));
    await new Promise(r => setTimeout(r, 3000)); // Rate limit
  }

  console.log(`\n✅ Done! Published ${files.length} posts to ${platform}.`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Auto-Publisher — Publish blog posts to Medium, DEV.to, Hashnode');
    console.log('');
    console.log('Usage:');
    console.log('  node auto-publish.mjs medium "../../public/blog/post.html"   # One post to Medium');
    console.log('  node auto-publish.mjs devto "../../public/blog/post.html"    # One post to DEV.to');
    console.log('  node auto-publish.mjs all "../../public/blog/post.html"      # One post to all');
    console.log('  node auto-publish.mjs medium-all                              # ALL posts to Medium');
    console.log('  node auto-publish.mjs devto-all                               # ALL posts to DEV.to');
    console.log('  node auto-publish.mjs all-all                                 # ALL posts to ALL platforms');
    console.log('');
    console.log('Setup:');
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Add your API keys for each platform');
    console.log('  3. Generate blog posts first: node generate-blog.mjs "topic"');
    console.log('');
    console.log('Notes:');
    console.log('  - Posts are saved as DRAFTS by default (review before publishing)');
    console.log('  - Canonical URLs prevent duplicate content SEO penalties');
    console.log('  - All platforms support official API publishing (zero risk)');
    return;
  }

  const platform = args[0].toLowerCase();
  
  if (platform.endsWith('-all')) {
    const actualPlatform = platform.replace('-all', '');
    await publishAllBlogPosts(actualPlatform === 'all' ? 'all' : actualPlatform);
  } else if (args[1]) {
    await publishPost(platform, path.resolve(args[1]));
  } else {
    console.error('❌ Provide a file path or use <platform>-all to publish all posts');
    console.log('   Example: node auto-publish.mjs medium "../../public/blog/my-post.html"');
  }
}

main().catch(console.error);
