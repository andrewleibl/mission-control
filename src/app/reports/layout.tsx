// Standalone layout for report pages — hides MC sidebar completely
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .sidebar-desktop-spacer { display: none !important; }
        aside { display: none !important; }
        main { width: 100% !important; min-width: 100% !important; }
      `}</style>
      {children}
    </>
  )
}
