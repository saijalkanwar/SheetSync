# CollabSheets — Real-Time Collaborative Spreadsheet

A lightweight, real-time collaborative spreadsheet application built as the Trademarkia Frontend Engineering Assignment.

**Live Demo:** _[deploy to Vercel and add URL here]_  
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Firebase (Auth + Firestore)

---

## Features

### Core
| Feature | Details |
|---|---|
| **Document Dashboard** | List all docs with title, last-modified date; create & delete |
| **Real-time Grid** | 100 rows × 26 columns, sticky headers, scrollable |
| **Formulas** | `=SUM`, `=AVERAGE`, `=MAX`, `=MIN`, `=COUNT`, `=COUNTIF`, `=COUNTA`, `=IF`, `=ROUND`, `=ABS`, `=SQRT`, `=TODAY`, `=NOW`, `=CONCAT`, `=LEN`, `=UPPER`, `=LOWER`, arithmetic |
| **Real-time Sync** | Firestore live subscription, 400ms debounced writes, optimistic updates |
| **Save Indicator** | Visual feedback: Saved / Saving… / Unsaved / Error |
| **Presence** | Live collaborator cursors with name badge & colour, 15 s heartbeat, 30 s stale filter |
| **Identity** | Google Sign-In + Guest mode with display name & deterministic colour |

### Bonus
| Feature | Details |
|---|---|
| **Cell formatting** | Bold, italic, underline, strikethrough, font size, text colour, fill colour, alignment |
| **Column resize** | Drag right edge of column header — instant feedback |
| **Drag reorder** | Drag column or row header to reorder — cell addresses preserved |
| **Keyboard nav** | Arrow keys, Tab, Enter, Delete, Escape |
| **Context menu** | Right-click → Insert row/column, Delete row/column |
| **CSV export** | Download visible data as `.csv` |

---

## Local Setup

### 1. Clone & install
```bash
git clone <your-repo-url>
cd spreadsheet
npm install
```

### 2. Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Create project
2. Enable **Authentication** → Sign-in methods → **Google**
3. Enable **Firestore Database** → Start in production mode
4. Project settings → Your apps → Add web app → copy config values

### 3. Environment variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules
In the Firebase console → Firestore → Rules, paste the contents of `firestore.rules`.

### 5. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel login
vercel --prod
```

Add the six `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Architecture

```
app/
  page.tsx              # Dashboard — document list, create/delete
  login/page.tsx        # Google Sign-In + guest flow
  doc/[id]/page.tsx     # Editor — grid, formula bar, toolbar, presence
  components/
    Grid.tsx            # Core grid — render, edit, formulas, drag reorder
    Toolbar.tsx         # Formatting toolbar with live colour pickers
    FormulaBar.tsx      # Cell address + formula input
    Navbar.tsx          # Title, share, user avatar
    PresenceBar.tsx     # Live collaborator dots
    SaveIndicator.tsx   # Saving / Saved indicator
    NameModal.tsx       # Guest name & colour picker
    DocumentCard.tsx    # Dashboard doc card
lib/
  firebase.ts           # Firebase init (auth + firestore)
  auth-context.tsx      # AuthContext — Google sign-in, guest mode
  useSpreadsheet.ts     # Real-time Firestore cell sync hook
  usePresence.ts        # Presence tracking hook
  useDocuments.ts       # Document list Firestore hook
proxy.ts                # Next.js route guard (replaces middleware.ts in v16)
firestore.rules         # Firestore security rules
```

### Key Design Decisions

**State Management:**  
Global auth via AuthContext. Per-feature data via custom hooks. No Redux/Zustand needed.

**Real-time Strategy:**  
Each cell is a Firestore document at `/documents/{id}/cells/{cellId}`. Writes are debounced 400 ms. Reads use live `onSnapshot` subscriptions.

**Presence:**  
Each user writes `{ cell, name, color, updatedAt }` to `/documents/{id}/presence/{uid}`. 15 s heartbeat keeps the record fresh. Client filters records older than 30 s.

**Column/Row Reorder:**  
`colOrder` and `rowOrder` are local state arrays inside Grid. Cell IDs always use real spreadsheet addresses — reordering only changes the visual mapping, not the data. Formulas continue to reference the original addresses.

---

## Formula Reference

| Formula | Example |
|---|---|
| `=SUM(range)` | `=SUM(A1:A10)` |
| `=AVERAGE(range)` | `=AVERAGE(B1:B5)` |
| `=MAX/MIN(range)` | `=MAX(C1:C20)` |
| `=COUNT/COUNTA(range)` | `=COUNTA(A1:A10)` |
| `=IF(cond,yes,no)` | `=IF(A1>10,"High","Low")` |
| `=COUNTIF(range,crit)` | `=COUNTIF(A1:A10,">5")` |
| `=ROUND(val,dp)` | `=ROUND(A1,2)` |
| `=TODAY()` / `=NOW()` | current date/time |
| `=CONCAT(A1,B1)` | concatenate |
| `=LEN/UPPER/LOWER(cell)` | string functions |
| Arithmetic | `=A1*B1+C1` |

---

## Evaluation Checklist

- [x] Builds with 0 TypeScript errors
- [x] Real-time sync (open same doc in two tabs)
- [x] Presence — live coloured cursors
- [x] Formula engine
- [x] Google Sign-In + guest mode + route guards
- [x] Dashboard — create, delete, list documents
- [x] Bonus: formatting, resize, drag-reorder, context menu, CSV export
