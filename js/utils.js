/* ══════════════════════════════════════
   js/utils.js — Shared utility functions
══════════════════════════════════════ */

/** Escape HTML special characters to prevent XSS */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Show/hide field validation error */
function setFieldError(fieldId, errId, show, msg) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(errId);
  if (show) {
    field.classList.add('has-error');
    if (msg) errEl.textContent = msg;
  } else {
    field.classList.remove('has-error');
  }
}

/** Update the capacity bar color based on percentage */
function barColor(pct) {
  if (pct >= 90) return 'var(--red)';
  if (pct >= 70) return 'var(--orange)';
  return 'var(--green)';
}
