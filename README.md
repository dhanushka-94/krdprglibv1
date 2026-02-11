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

## Deploy on Vercel

1. **Push your code to GitHub** (you already have `https://github.com/dhanushka-94/krdprglibv1`).

2. **Import the project on Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
   - Click **Add New… → Project**, select the repo `krdprglibv1`.
   - Leave **Framework Preset** as Next.js and **Root Directory** as `.` → **Deploy** (it will fail until env vars are set).

3. **Set environment variables**  
   In the project → **Settings → Environment Variables**, add (for **Production**, and optionally Preview):

   | Name | Notes |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `JWT_SECRET` | Strong random string (e.g. `openssl rand -base64 32`) |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` (or custom domain) |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web config |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web config |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase web config |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase web config |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web config |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web config |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | **Required for uploads.** Paste the **entire** JSON from your Firebase service account key file (single line or multi-line). On Vercel you cannot use a file path. |

4. **Supabase Auth URLs**  
   In Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: `https://your-app.vercel.app` (or your custom domain)
   - **Redirect URLs**: add `https://your-app.vercel.app/**` (and your custom domain if you use one)

5. **Redeploy**  
   Vercel → **Deployments** → ⋮ on the latest → **Redeploy** (or push a new commit).

Your app will be live at `https://your-app.vercel.app`. Admin: `https://your-app.vercel.app/admin`.

**Note:** Vercel serverless has a request body limit (~4.5 MB on Hobby). Uploading large MP3s via the app’s upload API may hit that limit; for very large files consider client-side upload to Firebase or upgrading the plan.

## Structure

**Public (no login):**
- `/` – Programmes list (main entry)
- `/programmes` – Same programmes list
- `/programmes/[slug]` – Programme detail with audio player & SEO

**Admin (login required):**
- `/admin` – Dashboard
- `/admin/categories` – Category CRUD
- `/admin/subcategories` – Subcategory CRUD
- `/admin/programmes` – Programme list & filters
- `/admin/programmes/upload` – Upload new programme

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
