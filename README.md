# Krushi Radio - Audio Library

Audio library with backend for uploading and managing programmes. MP3 files are stored in Firebase Storage; metadata is stored in Supabase.

## Features

- **Categories & Subcategories** – Full CRUD for hierarchical organization
- **Audio Programmes** – Upload MP3 (max 100MB), manage metadata
- **Firebase Storage** – MP3 files only, .mp3 extension enforced
- **Supabase** – Metadata storage (title, date, description, category, SEO)
- **SEO** – Per-programme SEO title, description, keywords
- **Greenish-white theme** – Clean UI with shadcn components

## Setup

### 1. Environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Supabase**
- Create a project at [supabase.com](https://supabase.com)
- Get URL and anon key from Project Settings → API

**Firebase**
- Create a project at [Firebase Console](https://console.firebase.google.com)
- Add a web app and copy the config into `.env.local` as `NEXT_PUBLIC_FIREBASE_*`
- Enable Storage and create a bucket
- **Uploads require a service account** (otherwise you get `storage/unauthorized`): In Firebase Console → Project Settings → Service accounts → Generate new private key. Then either:
  - Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON string (e.g. in production), or
  - Save the JSON file and set `FIREBASE_SERVICE_ACCOUNT_PATH` to its path (e.g. `./firebase-service-account.json`)
- Set Storage rules (e.g. allow read for public; writes are done server-side via the service account)

### 2. Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: `http://localhost:3000` (or your production URL)
- **Redirect URLs**: Add `http://localhost:3000/auth/callback`

Create a user in Authentication → Users → Add user (email + password).

### 3. Supabase schema

Run the migration in Supabase SQL Editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste and run in Supabase Dashboard → SQL Editor
```

### 4. Firebase Storage rules (example)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 100 * 1024 * 1024
        && request.resource.contentType == 'audio/mpeg';
    }
  }
}
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

**Public (no login):**
- `/` – Programmes list (main entry)
- `/programmes` – Same programmes list
- `/programmes/[slug]` – Programme detail with audio player & SEO

**Admin (login required, obfuscated path):**
- `/{ADMIN_PATH}` – Dashboard (default: `/k7x9p2`)
- `/{ADMIN_PATH}/categories` – Category CRUD
- `/{ADMIN_PATH}/subcategories` – Subcategory CRUD
- `/{ADMIN_PATH}/programmes` – Programme list & filters
- `/{ADMIN_PATH}/programmes/upload` – Upload new programme

Set `NEXT_PUBLIC_ADMIN_PATH` in `.env.local` to customize the admin URL. Direct `/admin` access is blocked.

**Password reset (no email service):**
- **Change password (logged in):** My profile → Change password (current + new password).
- **Forgot password:** Login page → "Forgot password?" → enter email. A one-time reset link is generated and shown on the page (user opens or copies it). No email is sent. Run migration `009_password_reset_tokens.sql` in Supabase for the forgot-password flow.

## API

- `GET/POST /api/categories`
- `GET/PATCH/DELETE /api/categories/[id]`
- `GET/POST /api/subcategories?category_id=`
- `GET/PATCH/DELETE /api/subcategories/[id]`
- `GET/POST /api/programmes`
- `GET/PATCH/DELETE /api/programmes/[id]`
- `GET /api/programmes/slug/[slug]`
- `POST /api/upload` – Multipart form with `file` (MP3, max 100MB)
- `DELETE /api/upload?path=` – Delete file from Firebase Storage
