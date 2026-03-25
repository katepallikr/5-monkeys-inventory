# 5 Monkeys Inventory

This is the main inventory management app for 5 Monkeys. It handles tracking everything for the kitchen, bar, and hookah setup. Built with Next.js and Prisma for the db.

## getting started

1. Check that your `.env` is set up with the right db connection string. If you don't have it, ping someone on the team.
2. Run `npm install` to grab the latest packages. 
3. Start up the dev server:

```bash
npm run dev
```

It should be running at `http://localhost:3000`. To access the dashboard locally, just use the fallback dev pin (1234) for now. We will map this to real user accounts later.

## notes
- This uses the Next.js app router so try to keep server actions separated in the `app/actions/` folder instead of mixing them into components.
- There's a known quirk where Prisma sometimes gets out of sync locally. If your build fails complaining about missing types or exports, just run `npx prisma generate` to fix it up.
- We recently cleaned up the unused boilerplate SVGs and old folders, so try to keep things tidy before pushing.
