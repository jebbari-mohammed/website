/**
 * Diagnostic script — opens a specific notebook URL and checks what's on the page.
 * Run: node tools/ai-marketing/debug-notebooklm.mjs <notebook_url>
 */
import { launchBrowser } from './notebooklm-fresh.mjs';

const notebookUrl = process.argv[2] || 'https://notebooklm.google.com';

async function main() {
  console.log(`\n🔍 Diagnosing: ${notebookUrl}\n`);
  const { context, page } = await launchBrowser(false); // headless=false so you can SEE it

  try {
    await page.goto(notebookUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));

    console.log('📄 Page URL:', page.url());
    console.log('📄 Page title:', await page.title());

    // Check studio panel
    const studioText = await page.locator('.studio-panel').first()
      .textContent({ timeout: 2000 }).catch(() => null);
    console.log('\n🎛️ Studio panel text:', studioText?.slice(0, 300) || '(not found)');

    // Check audio-ready selectors
    const audioSelectors = [
      'artifact-library-item:has(button.artifact-action-button)',
      '.artifact-library-container artifact-library-item',
      'artifact-library-item',
      'audio',
    ];
    for (const sel of audioSelectors) {
      const count = await page.locator(sel).count().catch(() => 0);
      const vis = count > 0 ? await page.locator(sel).first().isVisible({ timeout: 1000 }).catch(() => false) : false;
      console.log(`  [${sel}]: count=${count}, visible=${vis}`);
    }

    // Check if customize button is there
    const custSelectors = [
      'button[aria-label*="Customise Audio Overview" i]',
      'button[aria-label*="Customize Audio Overview" i]',
      '.create-artifact-button-container button.edit-button',
      'button.edit-button-always-visible',
    ];
    console.log('\n🔧 Customize button selectors:');
    for (const sel of custSelectors) {
      const count = await page.locator(sel).count().catch(() => 0);
      const vis = count > 0 ? await page.locator(sel).first().isVisible({ timeout: 1000 }).catch(() => false) : false;
      console.log(`  [${sel}]: count=${count}, visible=${vis}`);
    }

    // Dump all buttons in studio panel area
    console.log('\n🔍 All buttons in studio area:');
    const buttons = await page.locator('.studio-panel button, .studio-panel [role="button"]').all().catch(() => []);
    for (const btn of buttons.slice(0, 15)) {
      const label = await btn.getAttribute('aria-label').catch(() => null);
      const text = await btn.textContent().catch(() => null);
      const vis = await btn.isVisible().catch(() => false);
      console.log(`  aria-label="${label}" text="${text?.trim().slice(0,40)}" visible=${vis}`);
    }

    console.log('\n⏳ Keeping browser open for 60s so you can inspect...');
    await new Promise(r => setTimeout(r, 60000));

  } finally {
    await context.close();
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
