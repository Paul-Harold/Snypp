// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import BoardDashboard from '@/features/boards/BoardDashboard';

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/');
      else setUserId(session.user.id);
    };
    checkUser();
  }, [router]);

  if (!userId) return <div className="text-center text-black p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8">
      {/* Just render the dashboard component directly! */}
      <BoardDashboard userId={userId} />
    </div>
  );
}