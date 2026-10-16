# It's TeaTime

It's TeaTime is a cozy reading and community app made for the little pauses in your day. Pour a cup in the morning or unwind with one in the evening, and find something uplifting, useful, or simply interesting to read.

## A little something for every cup

- Discover daily reads across motivation, fitness, spirituality, nature, and culture & history.
- Explore every category, with a featured daily post to make each visit feel welcoming and focused.
- Share your own posts, add images, and join the conversation with likes and comments.
- Catch up on current news and explore stories from different sources.
- Ask the TeaTime AI assistant questions about a post and learn a little more.
- Build a sharing habit with daily posting streaks.

## The idea

TeaTime is about making everyday learning feel relaxed and welcoming. It brings thoughtful reads, fresh perspectives, and friendly conversation into one place, so your tea break can become a small feel-good moment, whenever you take it.

Whether you have a few quiet minutes before the day begins or want to slow down after it, there's always something new to discover at It's TeaTime.

## Local setup

Create a Supabase PostgreSQL project and configure both connection strings in `backend/.env`: the Transaction pooler URL (port `6543`, with `pgbouncer=true`) as `DATABASE_URL`, and the Session pooler URL (port `5432`) as `DIRECT_URL`. Get both from the Supabase project's **Connect** dialog. Copy the remaining values you need from `backend/.env.example`.

Install and set up the backend from its own folder:

```powershell
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

Install and start the frontend separately in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

`npm run db:push` creates or updates the database directly from `backend/prisma/schema.prisma`; this project does not use migrations. `db:push` also generates Prisma Client when the backend server is not holding its engine file.
