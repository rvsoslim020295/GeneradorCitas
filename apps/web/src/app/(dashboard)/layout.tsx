export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-background)] text-[var(--color-on-background)] h-screen w-screen overflow-hidden flex antialiased">
      {children}
    </div>
  );
}
