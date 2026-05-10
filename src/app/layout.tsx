import type { Metadata } from "next";
import { DM_Sans, Roboto_Mono } from 'next/font/google';
import Sidebar from '@/components/Sidebar'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Straight Point Marketing Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${robotoMono.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#07090D' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
