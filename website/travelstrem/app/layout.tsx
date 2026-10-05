import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { RouteTransition } from "@/components/animations/RouteTransition";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { site, tracking } from "@/lib/content";
import "@/styles/tokens.scss";
import "./globals.scss";
import "@/styles/storytelling.scss";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "TravelsTREM | End-to-End Travel SaaS Platform", template: "%s | TravelsTREM" },
  description:
    "A white-label travel SaaS platform connecting customer experiences, enquiries, quotations, bookings, payments and operations.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "TravelsTREM",
    description: "The operating platform for modern travel businesses.",
    url: site.url,
  },
  icons: {
    icon: [
      {
        url: site.logoLightUrl,
        media: "(prefers-color-scheme: light)",
      },
      {
        url: site.logoDarkUrl,
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  other: { "google-adsense-account": tracking.adsenseClient },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t;try{t=document.cookie.match(/(?:^|; )travelsTrem_theme=(dark|light)/)?.[1]||localStorage.getItem('travelsTrem.theme')}catch(e){}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.add('theme--'+t);document.documentElement.style.colorScheme=t})()`,
          }}
        />

      </head>
      <body>
        <Header />
        <RouteTransition>{children}</RouteTransition>
        <Footer />
        <ScrollToTop />
        <Script
          id="adsense"
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${tracking.adsenseClient}`}
          crossOrigin="anonymous"
        />
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${tracking.analyticsId}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(tracking.analyticsId)});`}</Script>
      </body>
    </html>
  );
}
