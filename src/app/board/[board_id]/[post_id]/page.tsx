


import BoardDetail from "../../../../components/board/BoardDetail";
// Next.js 동적 라우트 오류 방지: 반드시 props를 동기적으로 받고, 구조분해 없이 사용
import { notFound } from "next/navigation";

export default async function BoardDetailPage({ params }: { params: Promise<{ board_id: string; post_id: string }> }) {
  const { board_id, post_id } = await params;
  if (!board_id || !post_id) {
    notFound();
    return null;
  }
  return <BoardDetail board_id={board_id} post_id={post_id} />;
}
