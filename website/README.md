# TravelsTREM marketing website

The single Next.js App Router marketing site for `travelstrem.com`.

Routes:

- `/` — platform landing page
- `/about` — company, leadership and vision
- `/partnership` — partner and agency information
- `/sales` — commercial models and demo booking

Run locally from the repository root:

```sh
pnpm --filter @apps/travelstrem-marketing dev
```

Build with:

```sh
pnpm build:website
```

For Vercel, create one project with `website` as the Root Directory and attach `travelstrem.com` and `www.travelstrem.com`. The app uses shared design-token sources outside this folder, so enable **Include source files outside of the Root Directory in the Build Step**.

`app.travelstrem.com` remains a separate product deployment and is only linked from the marketing navigation.
