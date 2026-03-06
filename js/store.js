/* ══════════════════════════════════════
   js/store.js — Shared state
   travelers[] is kept in sync with
   Firestore via dbListenTravelers()
   in app.js
══════════════════════════════════════ */

const BUS_CAPACITY = 50;

let travelers     = [];   // synced from Firestore in real time
let adminLoggedIn = false;
let editingId     = null;

const ADMIN_USER = 'admin';
const hashPw     = pw => btoa(pw + '_bethel_salt_2024');
const ADMIN_HASH = hashPw('bethel2024');

function totalSeats()     { return travelers.reduce((s, t) => s + (t.seats || 0), 0); }
function seatsRemaining() { return BUS_CAPACITY - totalSeats(); }
