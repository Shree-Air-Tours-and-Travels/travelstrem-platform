# TravelsTREM static website

This folder is a dependency-free static company and blog website. Deploy the contents of `website/` to any static host, or configure the host to serve `index.html` for `/`.

Positioning: Shree Air Tours and Travels owns and operates the travel agency. TravelsTREM is the internal technology platform built for that agency; its products and five engines are used by the agency team and its travel partners, agents and agency partners. TravelsTREM is not presented as software sold to external customers.

Product links are currently configured for:

- `https://trevio.travelstrem.com`
- Trevista, TreCare and TreHub currently show an in-development message rather than linking to unavailable deployments.

When those products are deployed, replace their `data-coming-soon` cards in `index.html` with their live URLs.

The header, footer and browser tab use `favicon.png`, the shared globe-and-airplane brand icon.

## Security

This is a dependency-free static site. It does not store user data, process form submissions, contain authentication, or include private keys. The Vercel `vercel.json` and Netlify-style `_headers` file add a restrictive Content Security Policy and standard browser protections: MIME sniffing prevention, clickjacking protection, strict referrer handling, disabled unused device permissions, cross-origin isolation, and HTTPS enforcement.

Deploy over HTTPS and keep the security headers enabled. The public email address, phone number, product links, and page content are intentionally public; they should not be treated as secrets.
