import Sidebar from '@/components/Sidebar';
import SetupBanner from '@/components/SetupBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 p-5 md:p-8 max-w-[1400px]">
        <SetupBanner />
        {children}
      </main>
    </div>
  );
}
