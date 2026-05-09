import type { Metadata } from "next";
import { DM_Sans } from 'next/font/google';
import Sidebar from '@/components/Sidebar'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
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
    <html lang="en" className={dmSans.variable}>
      <body style={{ margin: 0, padding: 0, background: '#07090D' }}>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ marginLeft: 240, flex: 1 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
