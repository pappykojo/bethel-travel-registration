/* ══════════════════════════════════════
   js/home.js — Registration page logic
══════════════════════════════════════ */

/** Show/hide the "Other congregation" text input */
function handleCongregationChange() {
  const sel  = document.getElementById('inp-congregation-select').value;
  const wrap = document.getElementById('cong-other-wrap');
  wrap.style.display = sel === 'other' ? 'block' : 'none';
  if (sel !== 'other') document.getElementById('inp-congregation-other').value = '';
  setFieldError('f-congregation', 'err-congregation', false);
}

/** Get final congregation value (handles "Other" case) */
function getCongregation() {
  const sel = document.getElementById('inp-congregation-select').value;
  if (sel === 'other') return document.getElementById('inp-congregation-other').value.trim();
  return sel;
}

/** Refresh seat counter, capacity bar, and seats dropdown */
function refreshHome() {
  const reserved  = totalSeats();
  const remaining = seatsRemaining();
  const pct       = Math.min((reserved / BUS_CAPACITY) * 100, 100);
  const isFull    = remaining <= 0;

  document.getElementById('stat-total').textContent      = BUS_CAPACITY;
  document.getElementById('stat-reserved').textContent   = reserved;
  document.getElementById('stat-available').textContent  = remaining;
  document.getElementById('bar-pct').textContent         = Math.round(pct) + '% filled';

  const bar            = document.getElementById('seat-bar');
  bar.style.width      = pct + '%';
  bar.style.background = barColor(pct);

  document.getElementById('stat-available').style.color  = isFull ? 'var(--red)' : 'var(--green)';
  document.getElementById('full-banner').style.display   = isFull ? 'block' : 'none';
  document.getElementById('reg-form-card').style.display = isFull ? 'none' : 'block';

  // Rebuild seats dropdown dynamically
  const sel = document.getElementById('inp-seats');
  const cur = sel.value;
  sel.innerHTML = '<option value="">— select —</option>';
  for (let i = 1; i <= Math.min(remaining, 10); i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + (i === 1 ? ' seat' : ' seats');
    sel.appendChild(opt);
  }
  if (cur) sel.value = cur;
}

/** Validate and submit the registration form */
async function handleSubmit() {
  const name         = document.getElementById('inp-name').value.trim();
  const phone        = document.getElementById('inp-phone').value.trim();
  const congregation = getCongregation();
  const congSelect   = document.getElementById('inp-congregation-select').value;
  const seats        = parseInt(document.getElementById('inp-seats').value);
  const notes        = document.getElementById('inp-notes').value.trim();
  const remaining    = seatsRemaining();

  let valid = true;

  setFieldError('f-name', 'err-name', !name);
  if (!name) valid = false;

  const phoneOk = /^\+?[\d\s\-(). ]{7,15}$/.test(phone);
  setFieldError('f-phone', 'err-phone', !phone || !phoneOk,
    !phone ? 'Phone number is required.' : 'Enter a valid phone number.');
  if (!phone || !phoneOk) valid = false;

  if (congSelect === 'other' && !congregation) {
    setFieldError('f-congregation', 'err-congregation', true, 'Please specify your congregation.');
    valid = false;
  } else {
    setFieldError('f-congregation', 'err-congregation', false);
  }

  if (!seats || seats > remaining) {
    setFieldError('f-seats', 'err-seats', true,
      seats > remaining ? `Only ${remaining} seat(s) remaining.` : 'Please select number of seats.');
    valid = false;
  } else {
    setFieldError('f-seats', 'err-seats', false);
  }

  if (!valid) return;

  const btn     = document.getElementById('submit-btn');
  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner"></span> Reserving...';

  try {
    // ── Optimistic update ───────────────────────────────────
    // Add to local travelers[] immediately so seat counter
    // updates right away — even before Firestore responds.
    const tempRecord = {
      firestoreId: '_temp_' + Date.now(),
      name, phone, congregation, seats, notes,
      created_at: new Date().toLocaleString(),
      _pending: true,
    };
    travelers.push(tempRecord);
    refreshHome();
    // ────────────────────────────────────────────────────────

    // Save to Firestore
    await dbAddTraveler({ name, phone, congregation, seats, notes });

    // Remove temp record — the real-time listener will replace it
    // with the actual Firestore document
    travelers = travelers.filter(t => !t._pending);

    // Build confirmation card
    document.getElementById('confirm-details').innerHTML = `
      <div class="confirm-row">
        <span class="label">Name</span>
        <span class="value">${esc(name)}</span>
      </div>
      <div class="confirm-row">
        <span class="label">Phone</span>
        <span class="value">${esc(phone)}</span>
      </div>
      ${congregation ? `
      <div class="confirm-row">
        <span class="label">Congregation</span>
        <span class="value">${esc(congregation)}</span>
      </div>` : ''}
      <div class="confirm-row">
        <span class="label">Seats Reserved</span>
        <span class="value" style="color:var(--blue);font-size:18px;">${seats}</span>
      </div>
      <div class="confirm-row">
        <span class="label">Registered</span>
        <span class="value">${new Date().toLocaleString()}</span>
      </div>
    `;

    // Reset form
    document.getElementById('inp-name').value                = '';
    document.getElementById('inp-phone').value               = '';
    document.getElementById('inp-congregation-select').value = '';
    document.getElementById('inp-congregation-other').value  = '';
    document.getElementById('cong-other-wrap').style.display = 'none';
    document.getElementById('inp-notes').value               = '';
    btn.disabled  = false;
    btn.innerHTML = '🚌 Reserve My Seat';

    showPage('page-success');

  } catch (err) {
    console.error('Registration failed:', err);
    // Roll back optimistic update on failure
    travelers = travelers.filter(t => !t._pending);
    refreshHome();
    btn.disabled  = false;
    btn.innerHTML = '🚌 Reserve My Seat';
    alert('Something went wrong saving your registration. Please try again.');
  }
}
