(() => {
  const form = document.getElementById('setup-form');
  const output = document.getElementById('note-output');
  const copy = document.getElementById('copy-note');
  const status = document.getElementById('copy-status');
  if (!form || !output || !copy || !status) return;
  const fields = [
    ['Variation', 'variation'], ['Support', 'support'],
    ['Front-foot setup', 'stance'], ['Load (include units and number of dumbbells)', 'load'],
    ['Left working leg, each set', 'left-reps'], ['Right working leg, each set', 'right-reps'],
    ['Rest and observations', 'observations'],
  ];
  function update() {
    output.value = ['Bulgarian split squat setup note', ...fields.map(([label, id]) => {
      const value = document.getElementById(id).value.trim().replace(/[\r\n]+/g, ' ');
      return `${label}: ${value || 'Not recorded'}`;
    })].join('\n');
    status.textContent = '';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
    status.textContent = 'Note updated. Copy it to keep a record.';
  });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = 'Copied. Paste it into your own training notes.';
    } catch {
      output.focus();
      output.select();
      status.textContent = 'Use your browser’s copy command on the selected note.';
    }
  });
  update();
})();
