# It's TeaTime

It's TeaTime is a personalized content and community app. Users can browse topic feeds, publish posts, like and review posts, follow preferred categories, read current news, and ask Gemini questions about a post.

## Features

- Sign up, log in, profile editing, and login streaks
- Personalized category feeds and daily posts
- Create, edit, and delete owned posts
- Post likes and user reviews
- NewsData.io headlines
- Gemini post Q&A with formatted responses
- Cloudinary profile and post images

## Stack

- Node.js, Express, React, React Router, Vite, Bootstrap
- PostgreSQL on Supabase with Prisma
- Passport local authentication and PostgreSQL-backed sessions
- NewsData.io and Gemini APIs
- Cloudinary image storage

## Setup

Requirements: Node.js 24.13 or later in the 24.x series, npm, and a PostgreSQL database.

1. Clone your GitHub repository and open its folder.
2. Install packages:

	```sh
	npm install
	```

3. Copy `backend/.env.example` to `backend/.env` (`Copy-Item backend/.env.example backend/.env` in PowerShell, or `cp backend/.env.example backend/.env` in macOS/Linux). Set the database URLs and a strong `SECRET`. Add Cloudinary credentials for image uploads, a `NEWSDATA_API_KEY` for headlines, and a `GEMINI_API_KEY` for AI answers.
4. Generate Prisma Client and apply migrations:

	```sh
	npm run db:generate
	npm run db:deploy
	```

5. Start the frontend and backend for development:

	```sh
	npm run dev
	```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to Express on port 8080. For production, run `npm run build` followed by `npm start`; Express serves the built React app. Run `npm test` for the backend tests.

## Project Structure

- `backend/prisma`: Prisma schema and database migrations
- `backend/src/config`: Prisma and Cloudinary configuration
- `backend/src/controllers`, `routes`, `middleware`, `services`, `utils`, `validation`: Express API modules
- `backend/scripts`: database seeding and legacy data import
- `frontend/src/components`, `pages`, `services`, `context`: React UI and client-side API/session code
- `frontend/public`: static assets and shared styles

### Database URLs

- `DATABASE_URL`: Supabase transaction-pooler URL for Prisma runtime queries.
- `DIRECT_URL`: direct database URL for Prisma migrations.
- `SESSION_DATABASE_URL`: direct or session-pooler URL for Express sessions; defaults to `DIRECT_URL` or `DATABASE_URL` when omitted.

### Sample and legacy data

`npm run db:seed` loads sample posts, but it deletes all existing feed rows first. Do not run it against a database containing posts you want to keep.

To import a legacy MongoDB database, set `MONGODB_URI` and optionally `MONGODB_DATABASE`, then run `npm run db:import-mongo` against the configured PostgreSQL database.

## Configuration

Keep `backend/.env` private and never commit API keys, passwords, or database URLs. `backend/.env.example` contains placeholders only.

## Author

**Abhishek**

- GitHub: https://github.com/s17052006abhishek-dev
- LinkedIn: https://www.linkedin.com/in/s-abhishek-40029a358/
