(() => {
  'use strict';
  const form = document.getElementById('brief-form');
  const output = document.getElementById('brief-output');
  const status = document.getElementById('brief-status');
  const copy = document.getElementById('copy-brief');
  if (!form || !output || !status || !copy) return;
  const field = id => document.getElementById(id);
  const read = id => field(id).value.trim() || 'Not supplied; ask before planning';
  const request = "Please ask about missing information before choosing a plan. Explain the exercises, sets, repetitions, starting-load approach, rest and warm-up. Keep the plan within my days, time and equipment. Tell me what to record after the session and what feedback changes the next workout. Don't diagnose pain or prescribe rehabilitation.";
  const build = () => {
    const days = [...form.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
    const minutes = field('minutes').value.trim();
    output.value = [
      'My first-workout training brief',
      `Goal: ${read('goal')}`,
      `Current experience: ${read('experience')}`,
      `Available days: ${days.length ? days.join(', ') : 'Not supplied; ask before planning'}`,
      `Minutes per session, including warm-up: ${minutes || 'Not supplied; ask before planning'}`,
      `Actual equipment and weights (with units): ${read('equipment')}`,
      `Recent training and other activity: ${read('history')}`,
      `Preferences or movements needing instruction: ${read('preferences')}`,
      '', request
    ].join('\n');
    status.textContent = 'Brief updated. Copy it before leaving this page.';
  };
  for (const id of ['build-brief', 'example-brief', 'clear-brief', 'copy-brief']) field(id).hidden = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.reportValidity()) build();
  });
  field('example-brief').addEventListener('click', () => {
    form.reset();
    field('goal').value = 'Build a consistent training routine';
    field('experience').value = 'Returning after a break';
    for (const input of form.querySelectorAll('input[type="checkbox"]')) input.checked = ['Monday', 'Friday'].includes(input.value);
    field('minutes').value = '35';
    field('equipment').value = 'Adjustable dumbbells, 2–10 kg each; no bench, barbell or cable machine';
    field('history').value = 'Returning after a break; describe recent activity before choosing workload';
    field('preferences').value = 'Prefer simple sessions; need instruction for unfamiliar lifts';
    build();
    status.textContent = 'Hypothetical example loaded. Replace it with your own information.';
  });
  field('clear-brief').addEventListener('click', () => {
    form.reset();
    build();
    status.textContent = 'Entries cleared. No entries are saved by this tool.';
  });
  form.addEventListener('input', () => { status.textContent = 'Entries changed. Select Update my brief before copying.'; });
  copy.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    build();
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = 'Brief copied. Paste it only into a service or note you choose.';
    } catch {
      output.focus();
      output.select();
      status.textContent = 'Copy access is unavailable. The brief is selected; copy it manually.';
    }
  });
})();
