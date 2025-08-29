import BoardWrite from "../../../../components/board/BoardWrite";
import { notFound } from "next/navigation";

async function fetchBoardMeta(board_id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/board/board-meta?board_id=${board_id}`);
  const data = await res.json();
  if (!res.ok || !data.success) return null;
  return data;
}

export default async function BoardWritePage({ params }: { params: Promise<{ board_id: string }> }) {
  const { board_id } = await params;
  console.log('board_id:', board_id); 
  const boardMeta = await fetchBoardMeta(board_id);
  if (!boardMeta) {
    notFound();
  }
  return <BoardWrite boardInfo={boardMeta} mode="write" />;
}
