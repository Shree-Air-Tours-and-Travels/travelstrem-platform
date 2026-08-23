# TravelsTREM static website

This folder is a dependency-free static company and blog website. Deploy the contents of `website/` to any static host, or configure the host to serve `index.html` for `/`.

Positioning: Shree Air Tours and Travels owns and operates the travel agency. TravelsTREM is the internal technology platform built for that agency; its products and five engines are used by the agency team and its travel partners, agents and agency partners. TravelsTREM is not presented as software sold to external customers.

All website destinations are managed in `site-config.js`. The production defaults are:

- `https://app.travelstrem.com/?tab=trevio&product=trevio`
- `https://app.travelstrem.com/?tab=trevista&product=trevista`
- `https://auth.travelstrem.com/partnership`

Change a destination once in `site-config.js`; every matching header, mobile, product, CTA, contact and footer link will use it. The HTML keeps functional fallback URLs so important navigation still works if JavaScript is unavailable.

`tailwind.css` is a compiled local stylesheet so the static page works with the production Content Security Policy. After changing utility classes in `index.html`, regenerate it from `tailwind-source.css` with Tailwind CSS 3.

`favicon-light.png` is the rounded master brand asset shared by every app. The build sync derives `favicon-dark.png` from it with a navy background and light mark for dark themes.

## Security

This is a dependency-free static site. It does not store user data, process form submissions, contain authentication, or include private keys. The Vercel `vercel.json` and Netlify-style `_headers` file add a restrictive Content Security Policy and standard browser protections: MIME sniffing prevention, clickjacking protection, strict referrer handling, disabled unused device permissions, cross-origin isolation, and HTTPS enforcement.

Deploy over HTTPS and keep the security headers enabled. The public email address, phone number, product links, and page content are intentionally public; they should not be treated as secrets.
