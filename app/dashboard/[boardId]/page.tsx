// app/dashboard/[boardId]/page.tsx
import BoardView from '@/features/boards/BoardView';

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const resolvedParams = await params;

  return (
    <div className="max-w-[1400px] mx-auto">
      <BoardView boardId={resolvedParams.boardId} />
    </div>
  );
}