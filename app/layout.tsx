import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TruthTrace AI - Image Authenticity Verification',
  description: 'Verify images. Locate tampering. Export evidence.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
