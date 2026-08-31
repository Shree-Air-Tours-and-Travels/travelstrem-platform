# TravelsTREM static website

This folder is a dependency-free static website. Deploy its generated files to any static host; no application server is required.

Positioning: Shree Air Tours and Travels owns and operates the travel agency. TravelsTREM is the internal technology platform built for that agency; its products and five engines are used by the agency team and its travel partners, agents and agency partners. TravelsTREM is not presented as software sold to external customers.

All shared data, destinations and page composition are managed by the single `TRAVELSTREM_WEBSITE` object in `site-data.js`. The production defaults are:

- `https://app.travelstrem.com/?tab=trevio&product=trevio`
- `https://app.travelstrem.com/?tab=trevista&product=trevista`
- `https://auth.travelstrem.com/partnership`

Page sections live under `src/sections/`, while page frames live under `src/pages/`. Change their order in `site-data.js`, then generate the final static pages with:

```sh
pnpm build:website
```

This combines the section files into `index.html` and `partnership.html`. Styles and browser behaviour are kept in `styles/` and `scripts/`; the generated HTML files should not be edited directly.

`favicon-light.png` is the rounded master brand asset shared by every app. The build sync derives `favicon-dark.png` from it with a navy background and light mark for dark themes.

## Security

This static site does not store user data, process form submissions, contain authentication, or include private keys. The Vercel configuration and Netlify-style `_headers` file add standard browser protections.

Deploy over HTTPS and keep the security headers enabled. The public email address, phone number, product links, and page content are intentionally public; they should not be treated as secrets.
