import { launchBrowser, createFreshNotebook, addSource } from './notebooklm-fresh.mjs';

async function run() {
  const { context, page } = await launchBrowser(false);
  try {
    const notebookUrl = await createFreshNotebook(page);
    console.log('Notebook URL:', notebookUrl);
    await addSource(page, 'https://example.com');
    
    console.log('Opening Studio Panel...');
    // expand studio panel
    const expandSelectors = [
      'button:has(mat-icon:text-is("dock_to_left"))',
      'button[aria-label*="expand" i]',
    ];
    for (const sel of expandSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      } catch {}
    }

    console.log('Finding Audio Overview...');
    const audioCardSelectors = [
      '.create-artifact-button-container:has(mat-icon:text-is("audio_magic_eraser"))',
      '[role="button"]:has(mat-icon:text-is("audio_magic_eraser"))',
      'button:has(mat-icon:text-is("audio_magic_eraser"))',
    ];
    
    let clicked = false;
    for (const sel of audioCardSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({timeout: 2000}).catch(()=>false)) {
        console.log(`Clicking ${sel}`);
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log('Could not click Audio Overview');
      return;
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('DOM after clicking Audio Overview:');
    const studioHtml = await page.locator('.studio-panel').innerHTML().catch(() => '');
    console.log('Studio HTML length:', studioHtml.length);
    if (studioHtml.includes('Generate') || studioHtml.includes('Generieren')) {
      console.log('Generate text found in Studio Panel!');
    }
    
    const dialogCount = await page.locator('mat-dialog-container').count();
    console.log('Dialogs open:', dialogCount);
    if (dialogCount > 0) {
      console.log('Dialog HTML:', await page.locator('mat-dialog-container').first().innerHTML().catch(() => ''));
    }

    // List all buttons in studio panel
    console.log('Buttons in Studio Panel:');
    const buttons = await page.locator('.studio-panel button, .studio-panel [role="button"]').all();
    for (const b of buttons) {
      const label = await b.getAttribute('aria-label').catch(()=>null);
      const text = await b.textContent().catch(()=>null);
      console.log(`  [btn] label="${label}" text="${text?.trim()}"`);
    }

    console.log('Trying to click Generate...');
    const genBtn = page.locator('button:has-text("Generate")').first();
    if (await genBtn.isVisible({timeout: 2000}).catch(()=>false)) {
      await genBtn.click();
      console.log('Clicked Generate!');
    } else {
      console.log('No Generate button visible.');
    }
    
    await new Promise(r => setTimeout(r, 3000));
    const finalStudioText = await page.locator('.studio-panel').textContent().catch(() => '');
    console.log('Final Studio Text:', finalStudioText.replace(/\n/g, ' '));
    
  } finally {
    console.log('Closing browser...');
    await context.close();
  }
}

run().catch(console.error);
