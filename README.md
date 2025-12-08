# PROSPECTSDATA

A web application for browsing construction projects and companies (developers, contractors, consultants).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, React Query
- **Backend/Database**: Supabase (PostgreSQL)
- **Monorepo**: pnpm workspaces

## Project Structure

```
├── web/          # User-facing website (port 3000)
├── admin/        # Admin dashboard (port 3001)
├── shared/       # Shared types, utils, and Supabase client
└── supabase/     # Database migrations and config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account (https://supabase.com)

### 1. Clone and Install

```bash
cd prospectsdataapp
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Copy `.env.example` to `.env.local` in both `web/` and `admin/` folders:

```bash
cp .env.example web/.env.local
cp .env.example admin/.env.local
```

4. Update the `.env.local` files with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migrations

Go to your Supabase dashboard > SQL Editor and run the contents of:
- `supabase/migrations/001_create_tables.sql`
- `supabase/seed.sql` (optional, for test data)

### 4. Start Development

```bash
# Start both web and admin apps
pnpm dev

# Or start individually:
pnpm dev:web    # http://localhost:3000
pnpm dev:admin  # http://localhost:3001
```

## Features

### Web App (User-facing)
- **Home Page**: Landing page with stats and features overview
- **Projects**: Browse and search projects with filters
  - Construction Projects from Dubai Municipality permits
  - RERA Developer Projects from RERA registry
- **Companies**: View developers, contractors, and consultants
  - Activity-based filtering (With Activity, All, No Activity)
  - Date range filtering (All Time, Last 30 Days, Last 90 Days, Last Year)
  - Area filtering with synonym search support
- **Project Detail**: Detailed project information
  - Title matching card format ("Project Type for Building Type")
  - Companies Involved section with active/past categorization
  - Clickable company names linking to company profiles
- **Company Detail**: Company info with project history

### Search Features
- **Search with Suggestions**: Autocomplete search across companies, projects, and areas
  - Real-time suggestions as you type
  - Keyboard navigation (arrows, Enter, Tab, Escape)
  - Icons for different entity types (companies, projects, areas)
  - Click-to-navigate to entity pages
- **Location Synonyms**: Search by common area names (e.g., "JVC" → "Jumeirah Village Circle")
  - 113+ Dubai areas with verified synonyms
  - Matched synonyms shown in brackets when searching

### UI Components
- **SearchableSelect**: Custom dropdown with search capability for long lists
  - Synonym support with matched synonym display
  - Click outside to close
  - Clear button for selected value
- **Select**: Custom dropdown matching SearchableSelect style
- **SearchWithSuggestions**: Search input with autocomplete dropdown

### Admin Dashboard
- **Dashboard**: Overview stats and quick actions
- **Projects**: View and manage project records
- **Companies**: View all companies
- **Import Data**: CSV import wizard with:
  - File upload
  - Data preview
  - Column mapping
  - Progress tracking
  - Error reporting

## CSV Import

1. Go to Admin Dashboard > Import Data
2. Upload your CSV file
3. Select the target table
4. Map CSV columns to database fields
5. Click "Start Import"

The importer supports all tables:
- `project_information`
- `land_registry`
- `buildings`
- `projects`
- `developers`
- `contractor_projects`
- `consultant_projects`

## Database

### Key Tables
- `project_information` - Construction permit data from Dubai Municipality
- `developers` - Developer companies with RERA projects
- `contractor_projects` - Contractor assignments to permits
- `consultant_projects` - Consultant assignments to permits
- `location_synonyms` - Maps common area names to official DLD names
- `search_index` - Unified search index for autocomplete suggestions

### Search Index
The `search_index` table provides fast autocomplete suggestions by indexing:
- Company names (developers, contractors, consultants)
- Project names and locations
- Area names with synonyms

Uses PostgreSQL trigram extension (`pg_trgm`) for fuzzy matching.

## Development

### Available Scripts

```bash
pnpm dev          # Start all apps
pnpm dev:web      # Start web app only
pnpm dev:admin    # Start admin app only
pnpm build        # Build all apps
pnpm lint         # Lint all apps
```

### Project Organization

- `shared/src/types/` - TypeScript interfaces
- `shared/src/utils/` - Utility functions
- `shared/src/supabase/` - Supabase client and queries
- `web/src/components/` - Web app components
- `admin/src/components/` - Admin app components

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin only) |

## License

Private - All rights reserved
