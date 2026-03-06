/* ══════════════════════════════════════
   js/admin.js — Admin login & dashboard
   All CRUD operations talk to Firestore
══════════════════════════════════════ */

/* ── LOGIN ── */

function handleLogin() {
  const user  = document.getElementById('inp-user').value.trim();
  const pass  = document.getElementById('inp-pass').value;
  const errEl = document.getElementById('login-error');

  if (user === ADMIN_USER && hashPw(pass) === ADMIN_HASH) {
    adminLoggedIn = true;
    errEl.style.display = 'none';
    document.getElementById('inp-user').value = '';
    document.getElementById('inp-pass').value = '';
    showPage('page-admin');
  } else {
    errEl.style.display = 'block';
  }
}

function handleLogout() {
  adminLoggedIn = false;
  showPage('page-home');
}

/* ── DASHBOARD ── */

function refreshAdmin() {
  if (!adminLoggedIn) { showPage('page-admin-login'); return; }

  const reserved  = totalSeats();
  const remaining = seatsRemaining();
  const pct       = Math.min((reserved / BUS_CAPACITY) * 100, 100);

  renderStats(reserved, remaining);
  renderCapacityBar(reserved, pct);
  renderTable();
}

function renderStats(reserved, remaining) {
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-tile">
      <div class="stat-tile-num">${travelers.length}</div>
      <div class="stat-tile-label">Total Registrations</div>
    </div>
    <div class="stat-tile orange">
      <div class="stat-tile-num" style="color:var(--orange)">${reserved}</div>
      <div class="stat-tile-label">Seats Reserved</div>
    </div>
    <div class="stat-tile ${remaining === 0 ? '' : 'green'}">
      <div class="stat-tile-num" style="color:${remaining === 0 ? 'var(--red)' : 'var(--green)'}">
        ${remaining}
      </div>
      <div class="stat-tile-label">Seats Remaining</div>
    </div>
    <div class="stat-tile gold">
      <div class="stat-tile-num" style="color:var(--gold)">${BUS_CAPACITY}</div>
      <div class="stat-tile-label">Bus Capacity</div>
    </div>
  `;
}

function renderCapacityBar(reserved, pct) {
  document.getElementById('admin-bar-pct').textContent =
    `${reserved} / ${BUS_CAPACITY} seats (${Math.round(pct)}%)`;
  const bar        = document.getElementById('admin-seat-bar');
  bar.style.width  = pct + '%';
  bar.style.background = barColor(pct);
}

function renderTable() {
  document.getElementById('table-heading').textContent = `Registrations (${travelers.length})`;
  const wrap = document.getElementById('admin-table-wrap');

  if (travelers.length === 0) {
    wrap.innerHTML = '<div class="empty-state">No registrations yet.</div>';
    return;
  }

  const rows = travelers.map((t, i) =>
    editingId === t.firestoreId ? renderEditRow(t, i) : renderReadRow(t, i)
  ).join('');

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Phone</th>
          <th>Congregation</th>
          <th>Seats</th>
          <th>Notes</th>
          <th>Date Registered</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderReadRow(t, i) {
  return `
    <tr>
      <td style="color:var(--muted);font-size:12px;">${i + 1}</td>
      <td style="font-weight:600;">${esc(t.name)}</td>
      <td>${esc(t.phone)}</td>
      <td style="color:var(--slate);">${t.congregation || '—'}</td>
      <td><span class="badge">${t.seats}</span></td>
      <td style="color:var(--slate);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${t.notes || '—'}
      </td>
      <td style="font-size:12px;color:var(--muted);white-space:nowrap;">${t.created_at}</td>
      <td>
        <div class="gap-actions">
          <button class="btn-edit-sm"   onclick="startEdit('${t.firestoreId}')">Edit</button>
          <button class="btn-danger-sm" onclick="deleteEntry('${t.firestoreId}')">Delete</button>
        </div>
      </td>
    </tr>`;
}

function renderEditRow(t, i) {
  return `
    <tr>
      <td style="color:var(--muted);font-size:12px;">${i + 1}</td>
      <td><input class="inline-input" id="ed-name"  value="${esc(t.name)}"         style="min-width:120px;"/></td>
      <td><input class="inline-input" id="ed-phone" value="${esc(t.phone)}"        style="min-width:110px;"/></td>
      <td><input class="inline-input" id="ed-cong"  value="${esc(t.congregation)}" style="min-width:100px;"/></td>
      <td>
        <input class="inline-input" id="ed-seats" type="number"
          min="1" max="${BUS_CAPACITY}" value="${t.seats}" style="width:60px;"/>
      </td>
      <td><input class="inline-input" id="ed-notes" value="${esc(t.notes)}" style="min-width:100px;"/></td>
      <td style="font-size:12px;color:var(--muted);white-space:nowrap;">${t.created_at}</td>
      <td>
        <div class="gap-actions">
          <button class="btn-save-sm"   onclick="saveEdit('${t.firestoreId}')">Save</button>
          <button class="btn-cancel-sm" onclick="cancelEdit()">Cancel</button>
        </div>
      </td>
    </tr>`;
}

/* ── CRUD (Firestore-backed) ── */

function startEdit(firestoreId)  { editingId = firestoreId; renderTable(); }
function cancelEdit()            { editingId = null;        renderTable(); }

async function saveEdit(firestoreId) {
  const newSeats   = parseInt(document.getElementById('ed-seats').value);
  const otherSeats = travelers
    .filter(t => t.firestoreId !== firestoreId)
    .reduce((s, t) => s + t.seats, 0);

  if (newSeats + otherSeats > BUS_CAPACITY) {
    alert(`Cannot exceed ${BUS_CAPACITY} total seats.`);
    return;
  }

  const updates = {
    name:         document.getElementById('ed-name').value.trim(),
    phone:        document.getElementById('ed-phone').value.trim(),
    congregation: document.getElementById('ed-cong').value.trim(),
    seats:        newSeats,
    notes:        document.getElementById('ed-notes').value.trim(),
  };

  try {
    await dbUpdateTraveler(firestoreId, updates);
    editingId = null;
    // travelers[] will update automatically via the real-time listener
  } catch (err) {
    console.error('Update failed:', err);
    alert('Failed to save changes. Please try again.');
  }
}

async function deleteEntry(firestoreId) {
  if (!confirm('Delete this registration?')) return;
  try {
    await dbDeleteTraveler(firestoreId);
    if (editingId === firestoreId) editingId = null;
    // travelers[] will update automatically via the real-time listener
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Failed to delete. Please try again.');
  }
}

/* ── EXPORT CSV ── */

function exportCSV() {
  const headers = ['Name', 'Phone', 'Congregation', 'Seats', 'Notes', 'Date Registered'];
  const rows    = travelers.map(t => [
    t.name, t.phone, t.congregation, t.seats, t.notes, t.created_at
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'bethel-registrations.csv';
  a.click();
}
