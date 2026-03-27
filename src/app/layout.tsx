import type { Metadata } from "next";
import Sidebar from '@/components/Sidebar'

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
      <body style={{ margin: 0, padding: 0, background: '#0D0D0D' }}>
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
