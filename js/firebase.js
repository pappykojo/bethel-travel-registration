/* ══════════════════════════════════════
   js/firebase.js — Firestore DB functions
══════════════════════════════════════ */

const {
  collection, addDoc, doc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy,
  serverTimestamp, getDoc, getDocs
} = window.firebase_firestore;

const db            = window._firestoreDb;
const TRAVELERS_COL = 'travelers';

/**
 * Add a new traveler registration to Firestore.
 */
async function dbAddTraveler(data) {
  return await addDoc(collection(db, TRAVELERS_COL), {
    ...data,
    created_at: serverTimestamp(),
  });
}

/**
 * Fetch all travelers once (fallback if listener fails).
 */
async function dbGetTravelers() {
  const q        = query(collection(db, TRAVELERS_COL), orderBy('created_at', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => formatDoc(d));
}

/**
 * Listen to the travelers collection in real time.
 * Calls onUpdate(travelers[]) on every change.
 * Calls onError(err) if the listener fails (e.g. rules block reads).
 */
function dbListenTravelers(onUpdate, onError) {
  const q = query(collection(db, TRAVELERS_COL), orderBy('created_at', 'asc'));
  return onSnapshot(
    q,
    snapshot => {
      const data = snapshot.docs.map(d => formatDoc(d));
      onUpdate(data);
    },
    err => {
      console.error('Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update an existing traveler document.
 */
async function dbUpdateTraveler(firestoreId, updates) {
  await updateDoc(doc(db, TRAVELERS_COL, firestoreId), updates);
}

/**
 * Delete a traveler document.
 */
async function dbDeleteTraveler(firestoreId) {
  await deleteDoc(doc(db, TRAVELERS_COL, firestoreId));
}

/** Format a Firestore doc snapshot into a plain object */
function formatDoc(d) {
  return {
    firestoreId: d.id,
    ...d.data(),
    created_at: d.data().created_at?.toDate?.().toLocaleString() ?? 'Just now',
  };
}
