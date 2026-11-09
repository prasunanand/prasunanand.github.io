// Everything this site's JavaScript does, with no dependencies: the mobile nav toggle, a copy button
// on each code block, and a scroll wrapper around tables. Ported from zasper-io.github.io.

document.getElementById('nav-toggle')?.addEventListener('click', () => {
  const nav = document.getElementById('site-nav');
  const open = nav.classList.toggle('is-open');
  document.getElementById('nav-toggle').setAttribute('aria-expanded', open);
});

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>';
const DONE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

// navigator.clipboard needs a secure context; where it fails, select the block instead so the
// reader is one Ctrl/Cmd-C away.
async function copyToClipboard(button, text, selectOnFailure) {
  if (!text) return;
  const label = button.getAttribute('aria-label');
  try {
    await navigator.clipboard.writeText(text);
    button.innerHTML = DONE_ICON;
    button.setAttribute('aria-label', 'Copied');
    button.classList.add('is-copied');
  } catch {
    const range = document.createRange();
    range.selectNodeContents(selectOnFailure);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.setAttribute('aria-label', 'Press Ctrl or Cmd + C to copy');
  }
  setTimeout(() => {
    button.innerHTML = COPY_ICON;
    button.setAttribute('aria-label', label);
    button.classList.remove('is-copied');
  }, 1500);
}

// The wrapper, not the <pre>, holds the button: the <pre> scrolls sideways and would carry it away.
for (const pre of document.querySelectorAll('.mk-body pre')) {
  const host = document.createElement('div');
  host.className = 'mk-code';
  pre.replaceWith(host);
  host.append(pre);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mk-code-copy';
  button.setAttribute('aria-label', 'Copy code');
  button.title = 'Copy';
  button.innerHTML = COPY_ICON;
  button.addEventListener('click', () => copyToClipboard(button, pre.textContent.replace(/\s+$/, ''), pre));
  host.append(button);
}

// A wide table scrolls in place instead of pushing the page wider than a phone.
for (const table of document.querySelectorAll('.mk-body table')) {
  const wrap = document.createElement('div');
  wrap.className = 'mk-table-scroll';
  table.replaceWith(wrap);
  wrap.append(table);
}
