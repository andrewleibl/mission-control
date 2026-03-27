import type { Metadata } from "next";
import { Roboto_Mono } from 'next/font/google';
import Sidebar from '@/components/Sidebar'

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
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
    <html lang="en">
      <body className={robotoMono.className} style={{ margin: 0, padding: 0, background: '#0D0D0D' }}>
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
