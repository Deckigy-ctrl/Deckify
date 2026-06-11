# Deckify

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the placeholder values in `.env.local` and fill in your real keys:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
deckify/
├── app/              # Next.js App Router routes & layouts
│   ├── api/          # Server-side API routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # Reusable UI components
├── lib/              # Utility functions and shared logic
├── .env.local        # Environment variables (not committed)
└── README.md
```

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude (via `ANTHROPIC_API_KEY`)
- **Database/Auth**: Supabase
