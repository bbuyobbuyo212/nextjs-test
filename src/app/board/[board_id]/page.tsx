import BoardList from "../../../components/board/BoardList";
import GalleryBoard from "../../../components/board/GalleryBoard";

export default async function BoardPage({ params }: { params: Promise<{ board_id: string }> }) {
  const { board_id } = await params;
  let isGallery = false;
  let boardInfo: any = { id: board_id, board_id };
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
    const resp = await fetch(`${baseUrl}/api/board/board-meta?board_id=${board_id}`, { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      boardInfo = { ...data, id: board_id, board_id }; // id 필드 유지
      const skin = typeof data?.skin === 'string' ? data.skin.toLowerCase() : '';
      isGallery = data?.type === 'gallery' || skin === 'gallery' || skin.startsWith('gallery');
    }
  } catch (e) {
    console.error('board_meta fetch error', e);
  }
  return isGallery ? <GalleryBoard boardInfo={boardInfo} /> : <BoardList boardInfo={boardInfo} />;
}