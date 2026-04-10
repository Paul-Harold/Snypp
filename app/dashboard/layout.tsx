// app/dashboard/layout.tsx
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* This Navbar will now appear on EVERY dashboard page */}
      <Navbar /> 
      
      {/* This 'children' prop is where the specific page content loads */}
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}