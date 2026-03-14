import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'sonner'
import CookieConsentBanner from '@/components/cookie-consent/CookieConsentBanner'
import StagingFeedbackWidget from '@/components/StagingFeedbackWidget'
import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
}

export const metadata: Metadata = {
  title: {
    default: 'SankalpHub — QC Automation & Inspection Dashboard for Garment Manufacturers',
    template: '%s | SankalpHub',
  },
  description: 'Automate your QC reports. Monitor defects in real-time. Make data-driven decisions across all your garment factories with SankalpHub.',
  keywords: ['QC automation', 'garment inspection', 'quality control', 'AQL inspection', 'defect analytics', 'garment manufacturing', 'factory monitoring'],
  authors: [{ name: 'SankalpHub' }],
  openGraph: {
    title: 'SankalpHub — QC Automation for Garment Manufacturers',
    description: 'Automate your QC reports. Monitor defects in real-time. Make data-driven decisions across all your factories.',
    url: 'https://sankalphub.in',
    siteName: 'SankalpHub',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SankalpHub — QC Automation for Garment Manufacturers',
    description: 'Automate your QC reports. Monitor defects in real-time.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/sankalphub-icon.svg?v=2', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png?v=2',
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://sankalphub.in'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'SankalpHub',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: 'QC Automation & Inspection Dashboard for Garment Manufacturers',
              url: 'https://sankalphub.in',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '19',
                highPrice: '99',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton duration={3000} />
        <CookieConsentBanner />
        <StagingFeedbackWidget />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
