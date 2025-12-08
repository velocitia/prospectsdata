# ProspectsData — Project Documentation

## Overview

A comprehensive Dubai real estate database application for browsing projects, developers, contractors, and consultants. Features include RERA project tracking, construction permit management, company profiles with contact information, and an admin dashboard for CSV data imports with Arabic-to-English translation support.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (Web) | Next.js 14 (App Router) |
| Frontend (Admin) | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3.4 |
| UI Components | Custom + shadcn/ui style |
| State Management | TanStack React Query + Zustand |
| Backend/Database | Supabase (PostgreSQL) |
| Package Manager | pnpm (Workspaces) |
| Shared Code | @repo/shared (TypeScript) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         MONOREPO                             │
├───────────────┬───────────────┬─────────────────────────────┤
│               │               │                             │
│   /web        │   /admin      │   /shared                   │
│   Port 3000   │   Port 3001   │   @repo/shared              │
│   User App    │   Admin App   │   Types, Utils, Queries     │
│               │               │                             │
└───────────────┴───────────────┴─────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  Row Level Security (RLS)                                    │
│  pg_trgm Extension (Fuzzy Search)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
prospectsdataapp/
│
├── web/                          # User-facing Next.js app (Port 3000)
│   ├── app/
│   │   ├── page.tsx              # Landing page with stats
│   │   ├── projects/
│   │   │   ├── page.tsx          # Projects list (RERA + Permits toggle)
│   │   │   ├── [parcelId]/       # Construction project detail
│   │   │   └── rera/[projectId]/ # Developer project detail
│   │   ├── companies/
│   │   │   ├── page.tsx          # Companies list with tabs
│   │   │   └── [type]/[licenseNo]/ # Company detail
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                   # UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── select.tsx
│   │   │   ├── searchable-select.tsx
│   │   │   └── ...
│   │   ├── projects/
│   │   │   ├── project-card.tsx
│   │   │   ├── project-list.tsx
│   │   │   ├── project-filters.tsx
│   │   │   ├── rera-project-card.tsx
│   │   │   ├── rera-project-list.tsx
│   │   │   └── rera-project-filters.tsx
│   │   ├── companies/
│   │   │   ├── company-card.tsx
│   │   │   ├── company-list.tsx
│   │   │   ├── company-detail.tsx
│   │   │   └── company-filters.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   └── common/
│   │       ├── search-with-suggestions.tsx
│   │       ├── pagination.tsx
│   │       ├── loading-spinner.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── queries.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── package.json
│
├── admin/                        # Admin dashboard (Port 3001)
│   ├── app/
│   │   ├── page.tsx              # Dashboard with stats
│   │   ├── import/page.tsx       # CSV import wizard
│   │   ├── rera-projects/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── companies/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── components/
│   │   ├── import/
│   │   │   └── csv-import-wizard.tsx
│   │   ├── Header.tsx
│   │   └── StatsCard.tsx
│   │
│   └── package.json
│
├── shared/                       # Shared library (@repo/shared)
│   ├── src/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── supabase/
│   │   └── constants/
│   └── package.json
│
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_add_project_name.sql
│       └── 003_enhance_companies.sql
│
├── scripts/
│   ├── export-developers.js      # Export developers for Gemini
│   └── developers-for-gemini.json
│
├── data/                         # CSV import files
│   ├── Projects.csv
│   ├── Developers.csv
│   ├── Buildings.csv
│   ├── Land_Registry.csv
│   ├── Project_Information.csv
│   ├── Contractor_Projects.csv
│   └── Consultant_Projects.csv
│
├── package.json                  # Root package.json
├── pnpm-workspace.yaml
└── PROJECT_DOCUMENTATION.md
```

---

## Database Schema

### Core Tables

#### project_information (Construction Permits)
```sql
CREATE TABLE project_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_no INT UNIQUE NOT NULL,
  parcel_id INT NOT NULL,
  consultant_english VARCHAR,
  contractor_english VARCHAR,
  consultant_license_no INT,
  contractor_license_no INT,
  project_status_english VARCHAR,
  project_creation_date DATE,
  project_completion_date DATE,
  permit_date DATE,
  work_start_date DATE,
  expected_completion_date DATE,
  related_entity_name_en VARCHAR,
  applicanttype VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### projects (RERA Developer Projects)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INT UNIQUE NOT NULL,
  project_number INT,
  project_name VARCHAR,                    -- English translated name
  master_developer_id INT,
  developer_id INT,
  developer_name VARCHAR,
  master_developer_name VARCHAR,
  project_status VARCHAR,
  percent_completed INT,
  project_start_date DATE,
  project_end_date DATE,
  completion_date DATE,
  area_name_en VARCHAR,
  master_project_en VARCHAR,
  zoning_authority_en VARCHAR,
  project_description_en TEXT,
  no_of_lands INT,
  no_of_buildings INT,
  no_of_villas INT,
  no_of_units INT,
  escrow_agent_name VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### companies (Enhanced Company Profiles)
```sql
CREATE TABLE companies (
  license_no INT NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('developer', 'contractor', 'consultant')),
  name_en VARCHAR,
  name_ar VARCHAR,
  project_count INT DEFAULT 0,
  last_active_date DATE,
  active_area VARCHAR,

  -- Contact Information
  email VARCHAR,
  phone VARCHAR,
  fax VARCHAR,
  website VARCHAR,

  -- Address Information
  address TEXT,
  emirate VARCHAR,
  po_box VARCHAR,

  -- Company Profile
  established_year INT,
  employees_range VARCHAR,  -- '1-10', '11-50', '51-200', '201-500', '500+'
  description TEXT,
  specializations JSONB DEFAULT '[]'::jsonb,  -- ['Residential', 'Commercial']

  -- Key People & Social
  key_people JSONB DEFAULT '[]'::jsonb,       -- [{name, role, phone, email}]
  social_links JSONB DEFAULT '{}'::jsonb,     -- {linkedin, twitter, instagram, facebook}

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (license_no, type)
);
```

#### developers
```sql
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id INT UNIQUE NOT NULL,
  developer_number INT,
  developer_name_en VARCHAR,
  license_number VARCHAR,
  license_source_en VARCHAR,
  license_type_en VARCHAR,
  license_issue_date DATE,
  license_expiry_date DATE,
  legal_status_en VARCHAR,
  phone VARCHAR,
  fax VARCHAR,
  webpage VARCHAR,
  registration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### areas
```sql
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  munc_zip_code INT UNIQUE NOT NULL,
  area_name_en VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### location_synonyms
```sql
CREATE TABLE location_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  official_name VARCHAR NOT NULL,
  synonym VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(official_name, synonym)
);
```

#### Other Tables
- `land_registry` - Property and land records
- `buildings` - Building details (floors, units, amenities)
- `contractor_projects` - Contractor project assignments
- `consultant_projects` - Consultant project assignments
- `search_index` - Unified search with trigram matching
- `import_logs` - CSV import tracking

---

## Web App Features

### Projects Page (`/projects`)

**Dual View System:**
1. **Developer Projects (RERA)** - Default view
2. **Construction Projects (Permits)**

**RERA Project Card:**
```
┌─────────────────────────────────────────┐
│ #12345                    [Villa] [Building] [Status] │
│ Project Name or "X Villas + Y Buildings in Location" │
│ By Developer Name                                     │
│ 📍 Master Project                                     │
│    Area Name (lighter color)                          │
│ 🏠 X villas  🏢 Y buildings  ⊞ Z units               │
│ 📅 Started/Scheduled Date                             │
│ [████████░░░░░░░░░░░] 45%                            │
└─────────────────────────────────────────┘
```

**RERA Project Detail Page:**
```
┌─────────────────────────────────────────┐
│ Project #12345                                        │
│ Project Name in Location (large title)                │
│ 📍 Master Project                                     │
│    Area Name (lighter color)                          │
│ [Status Badge]                                        │
│ [████████░░░░░░░░░░░] 45%                            │
│                                                       │
│ [Project Overview Card with Timeline]                 │
│ [Summary Card - Villas, Buildings, Units, Area]       │
│ [Companies Involved Card]                             │
│ [Permit History Card]                                 │
└─────────────────────────────────────────┘
```

**Project Type Badges:**
- **Amber/Orange**: Villa/Townhouse (warmth, luxury)
- **Blue**: Building (residential/commercial)
- Projects with both show both badges

**RERA Filters:**
- Project Type Tabs: All | Villas/Townhouses | Buildings
- Search with autocomplete
- Status dropdown
- Area (searchable with synonyms)

**Construction Project Card:**
```
┌─────────────────────────────────────────┐
│ Project #12345                  [Status] │
│ <Project Type> for <Building Type>       │
│ 📍 Area Name                             │
│ 💼 Consultant Name                       │
│ 🔧 Contractor Name                       │
│ 🏢 Developer Name                        │
│ 📅 Created/Scheduled Date                │
└─────────────────────────────────────────┘
```

**Construction Project Detail Page:**
```
┌─────────────────────────────────────────┐
│ Project #12345                                        │
│ <Project Type> for <Building Type> in <Location>      │
│ [Status Badge]                                        │
│                                                       │
│ [Part of Developer Project Card] (if linked)          │
│ [Project Overview Card with Timeline]                 │
│ [Summary Card - Area sq ft]                           │
│ [Companies Involved Card]                             │
│ [Permit History Card]                                 │
└─────────────────────────────────────────┘
```

### Companies Page (`/companies`)

**Tabs:** All | Developers | Consultants | Contractors

**Company Card:**
```
┌─────────────────────────────────────────┐
│ [Icon] Company Name ✓        [Type]     │
│        License: 12345  Est. 2010        │
│ 📁 X projects    51-200 employees       │
│ [Residential] [Commercial] [+2]         │
│ 📞 📧 🌐                                │
│ 📍 Active Area                          │
│ 🕐 Active 3 days ago                    │
└─────────────────────────────────────────┘
```

**Filters:**
- Search with autocomplete
- Sort: Recently Active | Most Projects | Name (A-Z)
- Show: With Activity | All Companies | No Activity
- Active: All Time | Last 30 Days | Last 90 Days | Last Year
- Area: Searchable dropdown with synonyms

**Company Detail Page:**
- Header with verified badge, license, established year, employee count
- Quick Stats: Projects, Active Areas, Permits, Status
- About section (description)
- Specializations badges
- Contact Information (clickable phone/email/website)
- Social Links (LinkedIn, Twitter, Instagram, Facebook)
- Key People cards with contact info
- License Information (for developers)
- Projects/Permits list

### Search System

**SearchWithSuggestions Component:**
- Real-time autocomplete (300ms debounce)
- Searches: Companies, Projects, Areas
- Keyboard navigation (↑↓ Enter Tab Esc)
- Direct navigation to entity pages
- Powered by `search_index` table with pg_trgm

**Location Synonyms:**
| Official Name | Synonyms |
|---------------|----------|
| Al Hebiah Third | Damac Hills, Damac Hills 1 |
| Al Hebiah Fourth | Damac Hills 2, Akoya |
| Burj Khalifa | Downtown Dubai, Downtown |
| Wadi Al Safa 5 | Dubai Hills Estate |
| Palm Jumeirah | The Palm, Palm |
| Jumeirah Village Circle | JVC |
| And 100+ more... |

---

## Admin App Features

### Dashboard (`/`)
- Statistics cards: Projects, Buildings, Developers, Contractors, Consultants
- Quick action cards
- Database table overview

### CSV Import Wizard (`/import`)

**5-Step Process:**
1. **Upload** - Select table, upload CSV
2. **Preview** - View parsed data
3. **Mapping** - Map columns, enable transliteration
4. **Importing** - Progress bar, batch processing
5. **Complete** - Results and error logs

**Supported Tables:**
- project_information
- projects (with Arabic translation)
- developers
- buildings
- land_registry
- contractor_projects
- consultant_projects
- areas
- companies

**Translation Features:**
- Arabic-to-English transliteration (built-in)
- Gemini AI translations (for project names)
- Alerts for missing translations
- Date format auto-detection

### RERA Projects (`/rera-projects`)
- Table view with search
- Status badges with colors
- Pagination

---

## Key Query Functions

### Projects
```typescript
fetchRERAProjects(filters: RERAProjectFilters)
fetchProjects(filters: ProjectFilters)
fetchFilterOptions()
fetchRERAFilterOptions()
```

### Companies
```typescript
fetchCompanies(filters: CompanyFilters)
fetchCompanyDetails(licenseNo, type)
fetchCompanyAreas()
```

### Search & Location
```typescript
fetchSearchSuggestions(params)
getLocationSynonyms()
findOfficialAreaNames(searchTerm)
getAreaLookup()
```

### Utilities
```typescript
formatDate(dateStr)
normalizeStatus(status)      // Treats CONDITIONAL_ACTIVATING as Active
formatStatus(status)         // Title Case, hides Not Started/Pending
getStatusColor(status)       // green=Active, blue=Completed, yellow=On Hold, red=Cancelled
transliterateArabicToEnglish(text)
containsArabic(text)
```

---

## Status Handling

**Status Normalization:**
- `CONDITIONAL_ACTIVATING` is treated as `Active`
- Status displayed in Title Case (e.g., "Active", "Completed")

**Hidden Statuses:**
- `Not Started` - badge not shown
- `Pending` - badge not shown

**Status Badge Colors:**
| Status | Color | Badge Variant |
|--------|-------|---------------|
| Active, In Progress, Ongoing | Green | success |
| Completed, Done | Blue | info |
| On Hold, Delayed | Yellow | warning |
| Cancelled, Terminated | Red | destructive |
| Other | Gray | secondary |

**Status Filter:**
- CONDITIONAL_ACTIVATING is filtered out from dropdown (users select "Active" instead)
- When filtering by Active, both ACTIVE and CONDITIONAL_ACTIVATING records are included

---

## Icons (Lucide React)

| Purpose | Icon | Usage |
|---------|------|-------|
| Villas | `Home` | Villa count, Villa badge |
| Buildings | `Building2` | Building count, Developer |
| Units | `LayoutGrid` | Unit count |
| Lands | `LandPlot` | Land count |
| Area (sq ft) | `Square` | Property area |
| Location | `MapPin` | Area name, address |
| Date/Calendar | `Calendar` | Timeline dates |
| Consultant | `Briefcase` | Consultant company |
| Contractor | `HardHat` | Contractor company |
| Permits | `FileText` | Permit history |
| Companies | `Users` | Companies involved |

---

## TypeScript Types

```typescript
// Company Types
export type CompanyType = 'developer' | 'contractor' | 'consultant';

export interface Company {
  id: string;
  license_no: number;
  name: string;
  type: CompanyType;
  project_count: number;
  last_active_date: string | null;
  active_area: string | null;
  // Contact
  email: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  // Address
  address: string | null;
  emirate: string | null;
  po_box: string | null;
  // Profile
  established_year: number | null;
  employees_range: string | null;
  description: string | null;
  specializations: string[];
  key_people: KeyPerson[];
  social_links: SocialLinks;
  is_verified: boolean;
}

export interface KeyPerson {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

// Project Types
export interface RERAProject {
  project_id: number;
  project_number: number | null;
  project_name: string | null;
  developer_id: number | null;
  developer_name: string | null;
  developer_name_en: string | null;
  project_status: string | null;
  percent_completed: number | null;
  project_start_date: string | null;
  area_name_en: string | null;
  master_project_en: string | null;
  no_of_buildings: number | null;
  no_of_villas: number | null;
  no_of_units: number | null;
  // ...
}

export type ProjectTypeFilter = 'all' | 'villas' | 'buildings';
export type ProjectViewType = 'rera' | 'permits';
```

---

## Developer Name Cleaning

Names are cleaned for display by removing corporate suffixes:

```typescript
function cleanDeveloperName(name: string): string {
  return name
    .replace(/L\.?L\.?C\.?$/i, '')
    .replace(/S\.?O\.?C\.?$/i, '')
    .replace(/FZCO?\.?$/i, '')
    .replace(/FZE\.?$/i, '')
    .replace(/PJSC\.?$/i, '')
    .replace(/LIMITED$/i, '')
    .replace(/LTD\.?$/i, '')
    .replace(/BRANCH/gi, '')
    // If has DEVELOPMENT, remove REAL ESTATE
    .replace(/REAL\s+ESTATE\s+DEVELOP/gi, 'DEVELOP')
    .trim();
}
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Gemini AI (for translations)
GEMINI_API_KEY=your-gemini-key
```

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run both apps
pnpm dev

# Run individual apps
pnpm dev:web      # Port 3000
pnpm dev:admin    # Port 3001

# Build
pnpm build
pnpm build:web
pnpm build:admin

# Type check
cd web && npx tsc --noEmit

# Export developers for Gemini
node scripts/export-developers.js
```

---

## Database Migrations

### 001_create_tables.sql
- Core tables: project_information, projects, developers, buildings, land_registry, contractor_projects, consultant_projects
- Import logs table
- RLS policies

### 002_add_project_name.sql
- Added `project_name` column to projects table
- For storing English translations of Arabic project names

### 003_enhance_companies.sql
- Added comprehensive company profile fields:
  - Contact: email, phone, fax, website
  - Address: address, emirate, po_box
  - Profile: established_year, employees_range, description, specializations
  - People: key_people (JSONB)
  - Social: social_links (JSONB)
  - Verification: is_verified, verified_at, notes
- Synced developer contact info to companies table
- Added indexes for new columns

---

## Data Import Workflow

### CSV Import (Admin)
1. Navigate to `/import` in admin app
2. Select target table
3. Upload CSV file
4. Map columns (enable transliteration for Arabic)
5. Review and import
6. Check import logs for errors

### Company Data Enrichment
1. Export developers: `node scripts/export-developers.js`
2. Send to Gemini AI for public data gathering
3. Import enriched JSON back to database
4. Fields: email, phone, website, address, established_year, specializations, key_people, social_links

---

## Row Level Security

```sql
-- Public read access for all data tables
CREATE POLICY "Public read access" ON table_name
  FOR SELECT TO anon, authenticated USING (true);

-- Service role full access for imports
CREATE POLICY "Service role full access" ON table_name
  FOR ALL TO service_role USING (true);
```

---

## App Routes

### Web App
| Route | Description |
|-------|-------------|
| `/` | Landing page with stats |
| `/projects` | Projects list (RERA + Permits) |
| `/projects/[parcelId]` | Construction project detail |
| `/projects/rera/[projectId]` | Developer project detail |
| `/companies` | Companies list with tabs |
| `/companies/[type]/[licenseNo]` | Company detail |

### Admin App
| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats |
| `/import` | CSV import wizard |
| `/rera-projects` | RERA projects table |
| `/projects` | Projects management |
| `/companies` | Companies management |
| `/settings` | App settings |

---

## Future Enhancements

- [ ] User authentication
- [ ] Credit system for premium features
- [ ] User favorites/lists
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] API rate limiting
- [ ] Data export features
