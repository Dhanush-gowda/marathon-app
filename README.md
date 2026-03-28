# Marathon Manager

A production-ready, full-stack Marathon Management Web Application built with **Next.js 14** (App Router) and **Supabase**.

## Features

- **Role-Based Access**: Admin vs Participant with protected routes
- **Fully Responsive**: Mobile-first design, adapts to tablet and desktop
- **Participant Features**: Registration, leaderboard, race tracking
- **Admin Features**: Dashboard, participant management, result uploads, CSV export
- **Glassmorphism UI**: Modern dark theme with gradient accents and smooth animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Environment-based admin auth with token verification |
| Deployment | Vercel |

## Pages

### Public
| Route | Description |
|-------|-------------|
| `/` | Home page with hero, features, and categories |
| `/register` | Participant registration form |
| `/leaderboard` | Live rankings with category filter and pagination |
| `/track` | Search participant by bib number or email |

### Admin
| Route | Description |
|-------|-------------|
| `/admin/login` | Admin authentication |
| `/admin/dashboard` | Stats overview and quick actions |
| `/admin/participants` | Manage participants, assign bibs, check-in |
| `/admin/results` | Upload results via CSV or manual entry |

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/register` | Public | Register a participant |
| POST | `/api/admin/login` | Public | Admin login |
| GET | `/api/participants` | Admin | List all participants |
| POST | `/api/assign-bib` | Admin | Assign bib number |
| POST | `/api/checkin` | Admin | Check in participant |
| POST | `/api/results` | Admin | Add single result |
| POST | `/api/upload-results` | Admin | Bulk upload results via CSV |
| GET | `/api/leaderboard` | Public | Paginated leaderboard |
| GET | `/api/track` | Public | Track participant |
| GET | `/api/export` | Admin | Export CSV |

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd marathon-app
npm install
```

### 2. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=admin@marathon.com
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-random-secret-string
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Import Project**
2. Select your GitHub repository
3. Add environment variables (same as `.env.local`)
4. Click **Deploy**

### 3. Post-Deploy

- Verify all pages load correctly
- Test registration flow
- Test admin login and management
- Verify leaderboard and tracking

## CSV Format for Results Upload

```csv
bib_number,finish_time
101,03:45:22
102,04:10:15
103,03:22:08
```

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Full name |
| email | TEXT | Unique email |
| phone | TEXT | Phone number |
| category | TEXT | Race category |
| bib_number | TEXT | Unique bib number |
| checkin_status | BOOLEAN | Check-in status |
| created_at | TIMESTAMPTZ | Registration timestamp |

### results
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| finish_time | INTERVAL | Race completion time |
| rank | INTEGER | Overall ranking |
| created_at | TIMESTAMPTZ | Result timestamp |

## Performance

- Server-side rendering for public pages
- Pagination on all list views (20 items per page)
- Database indexes on email, category, bib_number, finish_time, and rank
- Row Level Security enabled on all tables
- Optimistic UI updates on admin actions

## License

MIT
