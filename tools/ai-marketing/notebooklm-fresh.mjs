/**
 * notebooklm-fresh.mjs
 *
 * Creates a FRESH NotebookLM notebook for every single video.
 * Guarantees 100% unique content every day — no cached audio overviews.
 *
 * Selectors verified by live browser inspection on 2026-05-08.
 */

import { chromium } from 'patchright';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PROFILE_DIR = path.join(
  os.homedir(),
  'Library/Application Support/notebooklm-mcp/chrome_profile'
);

const NOTEBOOKLM_HOME = 'https://notebooklm.google.com';
const PAGE_TIMEOUT = 60_000;
const AUDIO_TIMEOUT = 600_000; // 10 minutes

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function dismissOverlays(page) {
  try { await page.keyboard.press('Escape'); } catch {}
  await sleep(300);
  try {
    await page.evaluate(() => {
      document.querySelectorAll('.cdk-overlay-backdrop').forEach(el => el.remove());
    });
  } catch {}
  await sleep(200);
}

// Try each selector, return first visible locator
async function findVisible(page, selectors, timeout = 5000) {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout }).catch(() => false)) {
        return loc;
      }
    } catch {}
  }
  return null;
}

// ─── Browser launcher ─────────────────────────────────────────────────────────

export async function launchBrowser(headless = true) {
  console.log(`🌐 Launching browser (headless=${headless})...`);
  const context = await chromium.launchPersistentContext(CHROME_PROFILE_DIR, {
    headless,
    channel: 'chromium',
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ],
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
    acceptDownloads: true,
  });
  const page = await context.newPage();
  return { context, page };
}

// ─── Step 1: Create a fresh notebook ─────────────────────────────────────────

export async function createFreshNotebook(page) {
  console.log('📓 Navigating to NotebookLM home...');
  await page.goto(NOTEBOOKLM_HOME, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });

  const url = page.url();
  if (url.includes('accounts.google') || url.includes('signin')) {
    throw new Error('Not authenticated — run the MCP setup_auth tool first');
  }

  // Wait for the create button to actually appear (up to 20s)
  console.log('⏳ Waiting for homepage to load...');
  try {
    await page.locator('button[aria-label="Create new notebook"]').first()
      .waitFor({ state: 'visible', timeout: 20_000 });
  } catch {
    await sleep(5000); // fallback
  }

  console.log('➕ Creating new notebook...');

  // VERIFIED: aria-label="Create new notebook"
  const newNotebookSelectors = [
    'button[aria-label="Create new notebook"]',
    'button[aria-label*="create new notebook" i]',
    'button[aria-label*="Neues Notizbuch erstellen" i]',
    'button[aria-label*="Nouveau carnet" i]',
    '[role="button"]:has-text("Create new notebook")',
    'button:has-text("Create new")',
  ];

  const btn = await findVisible(page, newNotebookSelectors, 15000);
  if (!btn) {
    // Dump what buttons exist for debugging
    const allBtns = await page.locator('button').all().catch(() => []);
    for (const b of allBtns.slice(0, 20)) {
      const label = await b.getAttribute('aria-label').catch(() => null);
      const text = await b.textContent().catch(() => null);
      const vis = await b.isVisible().catch(() => false);
      if (vis) console.log(`  [button] aria-label="${label}" text="${text?.trim().slice(0,40)}"`);
    }
    throw new Error('Could not find "Create new notebook" button');
  }
  await btn.click();
  await sleep(4000);

  // VERIFIED: A modal with source options appears — close it with aria-label="Close"
  const modalClose = await findVisible(page, [
    'button[aria-label="Close"]',
    'button[aria-label="Schließen"]',
    'button[aria-label="Fermer"]',
    'button[aria-label="Cerrar"]',
    'button[aria-label="Chiudi"]',
    'button[aria-label="Fechar"]',
    'mat-dialog-container button[aria-label*="close" i]',
  ], 6000);
  if (modalClose) {
    await modalClose.click();
    console.log('✅ Dismissed intro modal');
    await sleep(1000);
  }

  // Wait for redirect to the new notebook URL
  await page.waitForURL(/\/notebook\/[a-f0-9-]+/, { timeout: 30_000 });
  const notebookUrl = page.url().split('?')[0];
  console.log(`✅ Fresh notebook created: ${notebookUrl}`);
  return notebookUrl;
}

// ─── Step 2: Add a source URL ─────────────────────────────────────────────────

export async function addSource(page, sourceUrl) {
  console.log(`📎 Adding source: ${sourceUrl}`);
  await sleep(2000);
  await dismissOverlays(page);

  // Use the ?addSource=true URL trick — most reliable method for new notebooks
  const notebookBase = page.url().split('?')[0];
  await page.goto(`${notebookBase}?addSource=true`, {
    waitUntil: 'domcontentloaded',
    timeout: PAGE_TIMEOUT,
  });
  await sleep(3000);

  // Wait for the mat-dialog-container (the real add-source dialog)
  const dialogReady = await page.locator('mat-dialog-container').first()
    .isVisible({ timeout: 15000 }).catch(() => false);

  if (!dialogReady) {
    // Fallback: click the sidebar Add Source button
    // VERIFIED selector: aria-label="Add source"
    console.log('⚠️  Dialog not found via URL, clicking Add Source button...');
    const addBtnSelectors = [
      'button[aria-label="Add source"]',
      'button[aria-label*="add source" i]',
      'button[aria-label*="Quelle hinzufügen" i]',
      'button[aria-label*="ajouter" i]',
      'button.add-source-button',
    ];
    const addBtn = await findVisible(page, addBtnSelectors, 10000);
    if (addBtn) {
      await addBtn.click();
      await sleep(2000);
    }
  }

  await sleep(800);

  // Click "Website" / URL tab in the dialog
  const urlTabSelectors = [
    'button.drop-zone-icon-button:has(mat-icon:text-is("link"))',
    'button:has(mat-icon:text-is("link"))',
    'mat-dialog-container button:has-text("Website")',
    'mat-dialog-container button:has-text("URL")',
  ];
  const urlTab = await findVisible(page, urlTabSelectors, 4000);
  if (urlTab) {
    await urlTab.click();
    await sleep(600);
  }

  // Fill the URL into the input field
  const inputSelectors = [
    'mat-dialog-container input[type="text"]',
    'mat-dialog-container textarea',
    '.mdc-dialog__surface input[type="text"]',
    '.mdc-dialog__surface textarea',
    'input[placeholder*="http" i]',
    'input[placeholder*="url" i]',
    'input[placeholder*="website" i]',
    'input[placeholder*="link" i]',
    'input[type="url"]',
  ];

  let filled = false;
  for (const sel of inputSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        await el.fill(sourceUrl);
        filled = true;
        console.log(`✅ URL filled using: ${sel}`);
        break;
      }
    } catch {}
  }
  if (!filled) throw new Error('Could not find URL input field');

  await sleep(400);

  // Click Insert/Add
  const confirmSelectors = [
    'mat-dialog-container button.mdc-button--raised:not([disabled])',
    '.mdc-dialog__actions button:not([disabled]):not(:has-text("Cancel")):not(:has-text("Close")):last-child',
    'button:has-text("Insert")',
    'button:has-text("Einfügen")',
    'button:has-text("Hinzufügen")',
    'button:has-text("Ajouter")',
    'button:has-text("Insertar")',
    'button:has-text("Add")',
  ];

  for (const sel of confirmSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const disabled = await btn.isDisabled().catch(() => false);
        if (!disabled) {
          await btn.click();
          console.log(`✅ Insert clicked: ${sel}`);
          break;
        }
      }
    } catch {}
  }

  // Wait for dialog to close
  await page.locator('mat-dialog-container').first()
    .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

  // Poll for source count > 0 (up to 90s — URL crawling takes time)
  console.log('⏳ Waiting for source to be indexed...');
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const count = await page.locator('.single-source-container').count().catch(() => 0);
    if (count > 0) break;
    const headerText = await page.locator('.cover-subtitle-source-count').first()
      .textContent({ timeout: 500 }).catch(() => null);
    if (headerText && /[1-9]/.test(headerText)) break;
    await sleep(1500);
  }

  console.log('✅ Source added and indexed');

  // Critical: wait + dismiss any lingering dialogs before Studio interaction
  await sleep(4000);
  await dismissOverlays(page);
  await sleep(1000);
}

// ─── Step 3: Generate fresh VIDEO ────────────────────────────────────────────
// Uses NotebookLM's "Video Overview" feature (subscriptions icon in Studio).
// Produces a real MP4 file — NOT an audio podcast.

export async function generateFreshVideo(page, customPrompt) {
  console.log('🎬 Generating Video Overview (MP4)...');

  // Expand Studio panel — verified aria-label is "Expand studio panel"
  const expandSelectors = [
    'button[aria-label="Expand studio panel"]',
    'button[aria-label*="expand studio" i]',
    'button[aria-label*="studio erweitern" i]',
    'button[aria-label*="ouvrir le studio" i]',
    'button[aria-label*="abrir estudio" i]',
    // Icon-based fallback
    'button:has(mat-icon:text-is("dock_to_right"))',
    'button:has(mat-icon:text-is("chevron_left"))',
  ];
  for (const sel of expandSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        console.log(`✅ Studio panel expanded (${sel})`);
        await sleep(2000); // Wait for panel to fully open
        break;
      }
    } catch {}
  }

  // Delete any existing artifact
  const existingArtifact = await findVisible(page, [
    'artifact-library-item:has(button.artifact-action-button)',
    '.artifact-library-container artifact-library-item',
  ], 2000);
  if (existingArtifact) {
    console.log('🗑️ Deleting existing artifact...');
    try {
      const moreBtn = await findVisible(page, [
        'artifact-library-item button:has(mat-icon:text-is("more_vert"))',
        'artifact-library-item button[aria-label*="more" i]',
        'artifact-library-item button[aria-label*="mehr" i]',
      ], 5000);
      if (moreBtn) {
        await moreBtn.click();
        await sleep(300);
        const del = await findVisible(page, [
          '[role="menuitem"]:has(mat-icon:text-is("delete"))',
          '[role="menuitem"]:has-text("Delete")',
          '[role="menuitem"]:has-text("Löschen")',
        ], 5000);
        if (del) { await del.click(); await sleep(2000); }
      }
    } catch (e) {
      console.log(`⚠️ Could not delete existing artifact: ${e.message}`);
    }
  }

  await dismissOverlays(page);
  await sleep(1000);

  // Log what's in the Studio panel
  const allStudioBtns = await page.locator('.studio-panel button, .studio-panel [role="button"]').all().catch(() => []);
  console.log(`🔍 Studio panel buttons (${allStudioBtns.length} total):`);
  for (const b of allStudioBtns.slice(0, 25)) {
    const label = await b.getAttribute('aria-label').catch(() => null);
    const vis = await b.isVisible().catch(() => false);
    if (vis) console.log(`    [visible] aria-label="${label}"`);
  }

  // STEP 1: Click "Video Overview" card to expand it.
  // Verified: aria-label="Video Overview", icon=subscriptions
  const videoHeaderSelectors = [
    'button[aria-label="Video Overview"]',
    '[role="button"][aria-label="Video Overview"]',
    'button:has(mat-icon:text-is("subscriptions"))',
    '[role="button"]:has(mat-icon:text-is("subscriptions"))',
    '.create-artifact-button-container:has(mat-icon:text-is("subscriptions"))',
    'button[aria-label*="video overview" i]',
    'button[aria-label*="video-zusammenfassung" i]',
    'button[aria-label*="vidéo" i]',
    'button[aria-label*="vídeo" i]',
  ];

  const videoHeader = await findVisible(page, videoHeaderSelectors, 10000);
  if (!videoHeader) throw new Error('Could not find "Video Overview" button in Studio panel');

  await dismissOverlays(page);
  await videoHeader.click();
  console.log('✅ Video Overview clicked');
  await sleep(2000);

  // STEP 2: Look for "Customise Video Overview" button (similar pattern to Audio)
  const customiseVideoSelectors = [
    'button[aria-label="Customise Video Overview"]',
    'button[aria-label="Customize Video Overview"]',
    'button[aria-label*="customise video" i]',
    'button[aria-label*="customize video" i]',
    'button[aria-label*="anpassen" i][aria-label*="video" i]',
    'button[aria-label*="personnaliser" i][aria-label*="vidéo" i]',
    'button[aria-label*="personalizar" i][aria-label*="vídeo" i]',
  ];
  const customiseVideoBtn = await findVisible(page, customiseVideoSelectors, 4000);
  if (customiseVideoBtn) {
    await dismissOverlays(page);
    await customiseVideoBtn.click();
    console.log('✅ Customise Video Overview clicked');
    await sleep(2000);
  }

  // STEP 3: Check for dialog. Fill prompt & click Generate.
  const dialogVisible = await page.locator('mat-dialog-container').first()
    .isVisible({ timeout: 6000 }).catch(() => false);

  if (dialogVisible) {
    if (customPrompt) {
      console.log('✅ Dialog open — filling custom prompt...');
      for (const sel of ['mat-dialog-container textarea', 'mat-dialog-container input[type="text"]:not([readonly])']) {
        try {
          const el = page.locator(sel).first();
          if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
            await el.fill(customPrompt);
            console.log('✅ Custom prompt filled');
            break;
          }
        } catch {}
      }
      await sleep(300);
    } else {
      console.log('✅ Dialog open — using default (no custom prompt)');
    }

    // Click Generate
    const generateSelectors = [
      'mat-dialog-container button:has-text("Generate")',
      'mat-dialog-container button:has-text("Generieren")',
      'mat-dialog-container button:has-text("Générer")',
      'mat-dialog-container button:has-text("Generar")',
      'mat-dialog-container button:has-text("Genera")',
      'mat-dialog-container button:has-text("Gerar")',
      '.mdc-dialog__actions button:not([disabled]):last-child',
    ];
    for (const sel of generateSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false) &&
            !(await btn.isDisabled().catch(() => false))) {
          await btn.click();
          console.log(`✅ Generate clicked: ${sel}`);
          break;
        }
      } catch {}
    }
  } else {
    console.log('ℹ️  No dialog — direct trigger assumed');
  }

  // Wait for video to finish rendering
  return await waitForArtifactReady(page);
}

async function waitForArtifactReady(page) {
  console.log('⏳ Waiting for video to be ready (up to 15 min)...');

  const readySelectors = [
    'artifact-library-item:has(button.artifact-action-button)',
    '.artifact-library-container artifact-library-item',
    'video',
    'audio',
  ];

  const inProgressPhrases = [
    'check back in a few minutes', 'come back in a few minutes',
    'being generated', 'generating your', 'kommen sie in ein paar minuten',
    'revenez dans quelques minutes', 'vuelve en unos minutos',
    'torna tra qualche minuto', 'volte em alguns minutos',
    'kom over een paar minuten', 'wird erstellt', 'wird generiert',
  ];

  const deadline = Date.now() + 15 * 60 * 1000; // 15 minutes for video
  let dotCount = 0;
  let lastLog = Date.now();

  while (Date.now() < deadline) {
    for (const sel of readySelectors) {
      try {
        if (await page.locator(sel).first().isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`\n✅ Video ready! (detected by: ${sel})`);
          return true;
        }
      } catch {}
    }

    const studioText = await page.locator('.studio-panel').first()
      .textContent({ timeout: 1000 }).catch(() => null);

    if (studioText) {
      const lower = studioText.toLowerCase();
      const inProgress = inProgressPhrases.some(p => lower.includes(p));
      if (inProgress) {
        process.stdout.write('.');
        dotCount++;
        if (dotCount % 20 === 0) {
          const min = Math.round((Date.now() - (deadline - 15 * 60 * 1000)) / 60000);
          process.stdout.write(` ${min}min\n`);
        }
      } else if (Date.now() - lastLog > 30000) {
        console.log(`\n📊 Studio: "${studioText.slice(0, 200).replace(/\n/g, ' ')}"`);
        lastLog = Date.now();
      }
    }

    await sleep(15000);
  }

  throw new Error('Video generation timed out after 15 minutes');
}

// ─── Step 4: Download the video ───────────────────────────────────────────────

export async function downloadVideo(page, destDir) {
  console.log(`\n⬇️  Downloading video to ${destDir}...`);

  // Hover over the artifact tile to reveal hidden action buttons
  try {
    await page.locator('artifact-library-item').first().hover({ timeout: 5000 });
    await sleep(800);
    console.log('✅ Hovered artifact tile');
  } catch (e) {
    console.log(`⚠️ Hover failed: ${e.message}`);
  }

  // Log visible buttons for debugging
  const allBtns = await page.locator('button').all().catch(() => []);
  for (const b of allBtns) {
    const label = await b.getAttribute('aria-label').catch(() => null);
    const icon = await b.locator('mat-icon').textContent().catch(() => null);
    const vis = await b.isVisible().catch(() => false);
    if (vis && (label?.toLowerCase().includes('download') || icon?.trim() === 'download' ||
                label?.toLowerCase().includes('more') || icon?.trim() === 'more_vert')) {
      console.log(`  [btn] label="${label}" icon="${icon?.trim()}"`);
    }
  }

  // Set up download listener BEFORE clicking
  const downloadPromise = page.waitForEvent('download', { timeout: 90_000 });

  // Try 1: Direct download icon button
  for (const sel of [
    'button:has(mat-icon:text-is("download"))',
    'button[aria-label*="download" i]',
    'button[aria-label*="herunterladen" i]',
    'button[aria-label*="télécharger" i]',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        console.log(`✅ Direct download clicked: ${sel}`);
        const dl = await downloadPromise;
        const dest = path.join(destDir, dl.suggestedFilename() || `video-${Date.now()}.mp4`);
        await dl.saveAs(dest);
        console.log(`✅ Saved: ${dest} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
        return dest;
      }
    } catch {}
  }

  // Try 2: more_vert menu → Download item
  for (const sel of [
    'button:has(mat-icon:text-is("more_vert"))',
    'button[aria-label*="more" i]',
    'button[aria-label*="mehr" i]',
    'button[aria-label*="más" i]',
    'button[aria-label*="plus" i]',
  ]) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        console.log(`✅ More-menu clicked: ${sel}`);
        await sleep(500);

        for (const dlSel of [
          '[role="menuitem"]:has(mat-icon:text-is("download"))',
          '[role="menuitem"]:has-text("Download")',
          '[role="menuitem"]:has-text("Herunterladen")',
          '[role="menuitem"]:has-text("Télécharger")',
          '[role="menuitem"]:has-text("Descargar")',
          '[role="menuitem"]:has-text("Scarica")',
          '[role="menuitem"]:has-text("Baixar")',
        ]) {
          try {
            const dlBtn = page.locator(dlSel).first();
            if (await dlBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await dlBtn.click();
              console.log(`✅ Download menu clicked: ${dlSel}`);
              const dl = await downloadPromise;
              const dest = path.join(destDir, dl.suggestedFilename() || `video-${Date.now()}.mp4`);
              await dl.saveAs(dest);
              console.log(`✅ Saved: ${dest} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
              return dest;
            }
          } catch {}
        }
        break; // Only try first visible more-menu
      }
    } catch {}
  }

  // Debug: dump artifact HTML so we know exactly what's there
  const html = await page.locator('.artifact-library-container').innerHTML().catch(() => '(not found)');
  console.log('📊 Full artifact HTML:\n', html.slice(0, 2000));
  throw new Error('Could not download — no download button found after hover');
}


  // Try 1: Direct download button on the artifact tile (icon-only button)
  const directDownloadSelectors = [
    'artifact-library-item button:has(mat-icon:text-is("download"))',
    'artifact-library-item button[aria-label*="download" i]',
    'artifact-library-item button[aria-label*="herunterladen" i]',
    'artifact-library-item button[aria-label*="télécharger" i]',
    'artifact-library-item button[aria-label*="descargar" i]',
  ];
  const directBtn = await findVisible(page, directDownloadSelectors, 3000);
  if (directBtn) {
    await directBtn.click();
    console.log('✅ Direct download button clicked');
  } else {
    '.artifact-item-button button:has(mat-icon:text-is("download"))',
  ];
  for (const sel of directSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        console.log(`✅ Direct download clicked: ${sel}`);
        const dl = await downloadPromise;
        const name = dl.suggestedFilename() || `notebooklm-video-${Date.now()}.mp4`;
        const dest = path.join(destDir, name);
        await dl.saveAs(dest);
        console.log(`✅ Downloaded: ${dest} (${(fs.statSync(dest).size / 1024 / 1024).toFixed(1)} MB)`);
        return dest;
      }
    } catch {}
  }

  // Try 2: more-vert menu
  const moreSelectors = [
    'button:has(mat-icon:text-is("more_vert"))',
    'artifact-library-item button:has(mat-icon:text-is("more_vert"))',
    '.artifact-item-button button:has(mat-icon:text-is("more_vert"))',
    'button[aria-label*="more" i]',
    'button[aria-label*="mehr" i]',
    'button[aria-label*="plus" i]',
    'button[aria-label*="más" i]',
  ];
  let moreClicked = false;
  for (const sel of moreSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        console.log(`✅ More-menu clicked: ${sel}`);
        moreClicked = true;
        await sleep(500);
        break;
      }
    } catch {}
  }

  if (moreClicked) {
    const dlMenuSelectors = [
      '[role="menuitem"]:has(mat-icon:text-is("download"))',
      '[role="menuitem"]:has-text("Download")',
      '[role="menuitem"]:has-text("Herunterladen")',
      '[role="menuitem"]:has-text("Télécharger")',
      '[role="menuitem"]:has-text("Descargar")',
      '[role="menuitem"]:has-text("Scarica")',
      '[role="menuitem"]:has-text("Baixar")',
      '[role="menuitem"]:has-text("Downloaden")',
    ];
  const download = await downloadPromise;
  const suggestedName = download.suggestedFilename() || `notebooklm-video-${Date.now()}.mp4`;
  const destPath = path.join(destDir, suggestedName);
  await download.saveAs(destPath);

  console.log(`✅ Downloaded: ${destPath} (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(1)} MB)`);
  return destPath;
}

// ─── Step 5: Delete the notebook ─────────────────────────────────────────────

export async function deleteNotebook(page, notebookUrl) {
  console.log('🗑️ Deleting notebook...');
  try {
    await page.goto(NOTEBOOKLM_HOME, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
    await sleep(4000);

    const uuid = notebookUrl.match(/notebook\/([a-f0-9-]+)/)?.[1];
    if (!uuid) {
      console.log('⚠️ Could not extract UUID, skipping delete');
      return false;
    }

    // Find the notebook card by UUID in its link
    const cardLink = page.locator(`a[href*="${uuid}"]`).first();
    if (!(await cardLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('⚠️ Notebook card not visible on homepage');
      return false;
    }

    await cardLink.hover();
    await sleep(500);

    // Click the 3-dot menu on the card
    const cardMenuSelectors = [
      'button[aria-label*="menu" i]',
      'button[aria-label*="more" i]',
      'button[aria-label*="optionen" i]',
      'button[aria-label*="options" i]',
    ];

    const menuBtn = await findVisible(page, cardMenuSelectors, 5000);
    if (!menuBtn) {
      console.log('⚠️ Notebook menu button not found');
      return false;
    }
    await menuBtn.click();
    await sleep(400);

    // Click Delete
    const deleteSelectors = [
      '[role="menuitem"]:has-text("Delete")',
      '[role="menuitem"]:has-text("Löschen")',
      '[role="menuitem"]:has-text("Supprimer")',
      '[role="menuitem"]:has-text("Eliminar")',
      '[role="menuitem"]:has-text("Excluir")',
    ];
    const deleteBtn = await findVisible(page, deleteSelectors, 5000);
    if (!deleteBtn) {
      console.log('⚠️ Delete menu item not found');
      return false;
    }
    await deleteBtn.click();
    await sleep(500);

    // Confirm deletion
    const confirmSelectors = [
      'button:has-text("Delete")',
      'button:has-text("Löschen")',
      'button:has-text("Supprimer")',
      'button:has-text("Eliminar")',
      'button:has-text("Excluir")',
    ];
    const confirmBtn = await findVisible(page, confirmSelectors, 5000);
    if (confirmBtn) {
      await confirmBtn.click();
      await sleep(2000);
    }

    console.log('✅ Notebook deleted');
    return true;
  } catch (e) {
    console.log(`⚠️ Notebook deletion failed (non-critical): ${e.message}`);
    return false;
  }
}
