import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { load } from 'cheerio';

function calculator() {
  const html = fs.readFileSync(new URL('../../public/workout-consistency-calculator/index.html', import.meta.url), 'utf8');
  const $ = load(html);
  const elements = new Map();
  $('[id]').each((_, node) => {
    const element = $(node);
    elements.set(element.attr('id'), {
      value: element.val() ?? '', textContent: element.text(), style: {},
      appendChild() {}, addEventListener() {},
    });
  });
  const copied = [];
  const context = vm.createContext({
    document: { getElementById: id => elements.get(id), createElement: () => ({}) },
    navigator: { clipboard: { writeText: text => { copied.push(text); return Promise.resolve(); } } },
    setTimeout() {},
  });
  vm.runInContext($('script:not([src])').last().text(), context);
  return { elements, copied, context };
}

for (const [completed, expectedRate] of [[5, '63%'], [0, '0%'], [8, '100%']]) {
  test(`preview and copied completion agree for ${completed} of 8 workouts`, async () => {
    const { elements, copied, context } = calculator();
    elements.get('planned').value = '8';
    elements.get('completed').value = String(completed);
    vm.runInContext('calculateConsistency()', context);
    assert.equal(elements.get('rate').textContent, expectedRate);
    assert.ok(elements.get('summary').textContent.startsWith(`You completed ${completed} of 8 planned workouts.`));
    const preview = elements.get('shareText').textContent;
    assert.equal(preview.split('\n')[2], `- Completion ${expectedRate} and ${completed}/8 plan execution`);
    assert.doesNotMatch(preview, /%%/);
    vm.runInContext('copyPlaybook()', context);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(copied, [preview]);
  });
}
