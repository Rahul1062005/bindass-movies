# BiNDASS Movies 🎬

## Project Description

BiNDASS Movies is a cinematic movie discovery platform that helps users explore films based on mood, track what they watch, and discover similar movies with a smooth, modern browsing experience.

## Screenshots (Placeholders) 📸

Replace these placeholders with actual product screenshots.

![Homepage Discovery](./public/screenshots/homepage-discovery.png)
![Movie Detail Page](./public/screenshots/movie-detail.png)
![Watch Tracking Dashboard](./public/screenshots/dashboard.png)

## Features ✨

### 1) Homepage Discovery
- Featured Discovery hero section
- Mood-based movie browsing sections
- Cinematic movie cards with rich visuals

### 2) Movie Detail Page
- Hero backdrop for immersive context
- Movie synopsis and essential metadata
- Trailer modal for quick previews
- Similar movie recommendations carousel

### 3) Watch Tracking System
- Plan to Watch list
- Watching list
- Watched list
- Favorites list

### 4) Dashboard
- Viewing statistics
- Recent activity timeline
- Personal movie lists and status-based organization

### 5) UI/UX Features
- Dark theme
- Horizontal scroll carousels
- Responsive design for mobile and desktop
- Smooth navigation and transitions

## Tech Stack 🛠️

- Next.js (App Router)
- React
- TypeScript
- TMDB API
- MongoDB (optional for movie storage)
- CSS Modules

## Project Structure 🗂️

```text
bindass-movies/
	public/
	scripts/
		backfill-posters.mjs
		count-missing-posters.mjs
		upgrade-tmdb-poster-size.mjs
	src/
		app/
			api/
				movies/
					route.ts
					[slug]/route.ts
					random/route.ts
			movies/
				[slug]/
			my-movies/
			globals.css
			layout.tsx
			page.tsx
		components/
			featured-discovery.tsx
			mood-discovery-sections.tsx
			movie-cards.tsx
			movie-tracking-control.tsx
			similar-movies-carousel.tsx
			trailer-modal.tsx
			theme-toggle.tsx
		lib/
			db/mongodb.ts
			movies/
				catalog.ts
				external.ts
				repository.ts
				tracking.ts
				types.ts
	package.json
	tsconfig.json
	README.md
```

## Installation Instructions 🚀

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

1. Clone the repository:

```bash
git clone <your-repository-url>
cd bindass-movies
```

2. Install dependencies:

```bash
npm install
```

3. Create an environment file:

```bash
cp .env.example .env.local
```

If `.env.example` is not present, create `.env.local` manually using the variables listed below.

## Environment Variables 🔐

Create `.env.local` in the project root:

```bash
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_optional_omdb_api_key
MONGODB_URI=your_optional_mongodb_connection_string
MONGODB_DB=bindass_movies
VERCEL_URL=your_deployment_domain
```

| Variable | Required | Description |
| --- | --- | --- |
| `TMDB_API_KEY` | Yes | API key used to fetch movie data from TMDB. |
| `OMDB_API_KEY` | No | Optional fallback movie metadata source when TMDB is insufficient. |
| `MONGODB_URI` | No | MongoDB connection string for persistent storage. |
| `MONGODB_DB` | No | MongoDB database name (default: `bindass_movies`). |
| `VERCEL_URL` | No | Deployment host fallback for server-side absolute URL generation. |

## Running Locally 💻

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start production build:

```bash
npm run start
```

Run lint checks:

```bash
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Instructions ☁️

### Vercel (Recommended)

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add all environment variables in Vercel Project Settings.
4. Deploy and verify API routes and movie detail pages.

### Other Node.js Hosting Platforms

1. Build the app:

```bash
npm run build
```

2. Start the server:

```bash
npm run start
```

3. Ensure environment variables are set on the host.

## Future Improvements 🔮

- User authentication and profile personalization
- AI-powered recommendation refinement
- Advanced filters (language, genre blend, runtime, release decade)
- Watchlist sharing and social recommendations
- Offline caching for repeated discovery sessions
- Analytics dashboard enhancements with deeper trend insights

## Author 👤

Rahul

Built with passion for cinema, discovery, and great user experience.
