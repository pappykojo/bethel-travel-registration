# Bethel Bus Trip — Setup Guide

## Firebase is already configured ✅
Your `firebaseConfig` is live in `index.html`. Nothing to change there.

---

## Step 1 — Enable Firestore Database

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Open your **bethel-trip** project
3. Left menu → **Firestore Database** → **Create database**
4. Choose **"Start in production mode"** → Next
5. Select your region → **Enable**

---

## Step 2 — Set Firestore Security Rules

In Firestore → **Rules** tab, replace the default with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /travelers/{id} {
      allow create: true;        // anyone can register
      allow read, update, delete: if true;  // open for now (admin dashboard)
    }
  }
}
```

> **After the trip**, lock it down by changing `read, update, delete` to `if false`.

---

## Step 3 — Run the Site

**Option A — Local (quick test):**
```bash
npx serve .
# then open http://localhost:3000
```
> Don't just double-click `index.html` — browsers block ES modules from `file://`

**Option B — Deploy free with Netlify:**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the `bethel-bus-trip` folder
3. Done — you get a live URL instantly

**Option C — Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to "." 
firebase deploy
```

---

## Admin Login
- **Username:** `admin`
- **Password:** `bethel2024`

To change the password, update `hashPw('bethel2024')` in `js/store.js`.

---

## File Structure
```
bethel-bus-trip/
├── index.html        ← Firebase config lives here
├── css/
│   └── style.css
└── js/
    ├── store.js      ← Shared state & auth
    ├── utils.js      ← Helper functions
    ├── firebase.js   ← Firestore read/write functions
    ├── home.js       ← Registration form logic
    ├── admin.js      ← Dashboard, CRUD, CSV export
    └── app.js        ← Router + real-time listener
```
