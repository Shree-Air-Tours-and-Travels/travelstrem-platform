import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { RouteTransition } from "@/components/animations/RouteTransition";
import { site, tracking } from "@/lib/content";
import "@/styles/tokens.scss";
import "./globals.scss";
import "@/styles/storytelling.scss";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "TravelsTREM | Travel, thoughtfully connected", template: "%s | TravelsTREM" },
  description:
    "Tours, reservations, experiences and travel management connected in one TravelsTREM ecosystem.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "TravelsTREM",
    description: "Travel, thoughtfully connected.",
    url: site.url,
  },
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
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
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${tracking.adsenseClient}`}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Header />
        <RouteTransition>{children}</RouteTransition>
        <Footer />
        <ScrollToTop />
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
