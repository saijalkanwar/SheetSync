# SheetSync — Real-time Collaborative Spreadsheet

A Google Sheets-inspired collaborative spreadsheet app built with **Next.js 16**, **TypeScript**, and **Firebase**.

---

## ✨ Features

### Core
- 📊 **Editable grid** — 100 rows × 26 columns, keyboard navigation (arrow keys, Tab, Enter, Escape)
- 🔢 **Formula engine** — `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `IF`, `COUNTIF`, `COUNTA`, `ROUND`, `ABS`, `SQRT`, `TODAY`, `NOW`, `CONCAT`, `LEN`, `UPPER`, `LOWER` + full arithmetic (`+`, `-`, `*`, `/`)
- 🔄 **Real-time sync** — Firestore-backed live collaboration
- 👥 **Presence indicators** — See who's online and which cell they're editing
- 🔐 **Authentication** — Google Sign-In or guest session

### Formatting
- **Bold / Italic / Underline / Strikethrough**
- **Font size** selector
- **Text colour** and **cell fill colour** pickers (16-colour palette each)
- **Text alignment** — Left / Center / Right
- **Column resize** — drag header borders
- **Drag-to-reorder** rows and columns

### Other
- 🌙 **Dark / Light mode** toggle (persists via `localStorage`)
- 🖱️ **Right-click context menu** — Insert / Delete rows and columns
- 📤 **Export CSV**
- 🎨 **Avatar colour** picker — change your presence colour in the user menu

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd spreadsheet
npm install
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → create a project
2. Enable **Firestore Database** and **Authentication → Google**
3. Copy your Firebase config

### 3. Configure environment variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔒 Firestore Security Rules

Deploy these rules from `firestore.rules` or paste into Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{docId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.ownerId;

      match /cells/{cellId} {
        allow read, write: if request.auth != null;
      }
      match /presence/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          request.auth.uid == userId;
      }
    }
  }
}
```

---

## ☁️ Deploy to Vercel

```bash
npx vercel --prod
```

Add the six `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## 🏗️ Architecture

```
app/
├── page.tsx                 # Dashboard — lists documents
├── login/page.tsx           # Login page
├── doc/[id]/page.tsx        # Editor page
└── components/
    ├── Grid.tsx             # Spreadsheet grid + formula engine
    ├── Toolbar.tsx          # Formatting toolbar
    ├── FormulaBar.tsx       # Formula / cell address bar
    ├── Navbar.tsx           # Top bar, title edit, theme toggle
    ├── PresenceBar.tsx      # Online collaborators
    ├── NameModal.tsx        # Guest name + colour picker
    ├── SaveIndicator.tsx    # Saving / Saved status
    └── DocumentCard.tsx     # Dashboard card

lib/
├── firebase.ts              # Firebase initialisation
├── auth-context.tsx         # Auth provider (Google + guest)
├── useSpreadsheet.ts        # Firestore cell sync hook
└── usePresence.ts           # Real-time presence hook
```

### Key design decisions

| Decision | Rationale |
|---|---|
| **Formats stored locally** | Cell formatting lives in a local `cellFormats` Map, completely independent of Firestore. This ensures colours/bold/etc. are never rolled back by Firestore reconnects or quota errors. |
| **Formula evaluation at render** | Formulas are re-evaluated in the Grid on every render using the current `data` Map, so cross-cell references always reflect live values without extra Firestore reads. |
| **`proxy.ts` instead of `middleware.ts`** | Next.js 16 renamed middleware to proxy; route guarding continues to work identically. |
| **Firestore quota handling** | `onSnapshot` error callbacks silently swallow `resource-exhausted` errors, keeping the app functional in offline/quota-limited mode. |

---

## 📋 Formula Reference

| Formula | Example |
|---|---|
| SUM | `=SUM(A1:A10)` |
| AVERAGE | `=AVERAGE(B1:B5)` |
| MIN / MAX | `=MIN(A1:D1)` |
| COUNT / COUNTA | `=COUNT(A1:A20)` |
| IF | `=IF(A1>10,"High","Low")` |
| COUNTIF | `=COUNTIF(A1:A10,">5")` |
| ROUND | `=ROUND(A1,2)` |
| ABS / SQRT | `=SQRT(ABS(A1))` |
| TODAY / NOW | `=TODAY()` |
| CONCAT | `=CONCAT(A1," ",B1)` |
| LEN / UPPER / LOWER | `=UPPER(A1)` |
| Arithmetic | `=A1+B1*C1-D1/2` |

---

## 📌 Notes

- The free Firebase **Spark plan** caps at 50 000 reads / 20 000 writes per day. Upgrade to **Blaze** for production use.
- Cell formatting is session-only (in-memory). It persists as long as the browser tab is open; refreshing clears it. This is intentional to avoid Firestore quota overhead.
