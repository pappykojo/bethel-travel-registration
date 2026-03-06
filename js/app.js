/* ══════════════════════════════════════
   js/app.js — App entry point & router
══════════════════════════════════════ */

/**
 * Navigate to a named page.
 */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  window.scrollTo(0, 0);

  const hooks = {
    'page-home':  refreshHome,
    'page-admin': refreshAdmin,
  };
  if (hooks[id]) hooks[id]();
}

/**
 * Re-render the currently active page with latest data.
 */
function rerenderActive() {
  const activePage = document.querySelector('.page.active')?.id;
  if (activePage === 'page-home')  refreshHome();
  if (activePage === 'page-admin') refreshAdmin();
}

/* ── Bootstrap ──────────────────────────────────────────
   Start a real-time Firestore listener.
   - On success: travelers[] is kept in sync automatically.
   - On error: falls back to a manual poll every 5 seconds
     (handles cases where Firestore rules block reads).
──────────────────────────────────────────────────────── */
let pollingInterval = null;

function startPolling() {
  console.warn('Listener failed — falling back to polling every 5s');
  if (pollingInterval) return; // already polling
  pollingInterval = setInterval(async () => {
    try {
      travelers = await dbGetTravelers();
      rerenderActive();
    } catch (e) {
      console.error('Poll failed:', e);
    }
  }, 5000);
}

dbListenTravelers(
  // ✅ Success — real-time update
  updatedTravelers => {
    if (pollingInterval) {
      clearInterval(pollingInterval); // listener recovered, stop polling
      pollingInterval = null;
    }
    travelers = updatedTravelers;
    rerenderActive();
  },
  // ❌ Error — start polling fallback
  () => startPolling()
);

// Also do an immediate fetch on load so the seat counter
// is accurate right away (before listener fires)
dbGetTravelers()
  .then(data => {
    travelers = data;
    rerenderActive();
  })
  .catch(() => {
    // Rules may be blocking — seat counter will stay at 0
    // until rules are updated. Show a warning in console.
    console.warn(
      '⚠️ Could not read from Firestore.\n' +
      'Go to Firebase Console → Firestore → Rules and set:\n' +
      '  allow read: if true;'
    );
  });
