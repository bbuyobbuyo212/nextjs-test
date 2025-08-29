import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BoardList from './BoardList';
import GalleryBoard from './GalleryBoard';
import BoardDetail from './BoardDetail';
import GalleryDetail from './GalleryDetail';
import BoardWrite from './BoardWrite';
import GalleryWrite from './GalleryWrite';

// 각 컴포넌트의 props 타입 import
// props 타입 import 구문 제거 (컴포넌트에서 직접 타입 선언만 하면 됨)

interface BoardInfo {
  board_id: string;
  name: string;
  type: string;
  skin?: string;
  listColumns?: number;
  thumbSize?: number;
}

const BoardScreen: React.FC = () => {
  const searchParams = useSearchParams();
  const board_id = searchParams?.get('board_id') || '';
  const action = searchParams?.get('action') || '';
  const post_id = searchParams?.get('post_id') || '';
  const [boardInfo, setBoardInfo] = useState<BoardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!board_id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/board/${board_id}`)
      .then(res => {
        if (!res.ok) throw new Error('게시판 정보를 불러올 수 없습니다.');
        return res.json();
      })
      .then(data => {
        setBoardInfo(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [board_id]);

  if (loading) return <div style={{textAlign:'center',padding:'2rem'}}>로딩중...</div>;
  if (error) return <div style={{color:'red',textAlign:'center',padding:'2rem'}}>오류: {error}</div>;
  if (!boardInfo) return <div style={{textAlign:'center',padding:'2rem'}}>게시판 정보를 불러올 수 없습니다.</div>;

  // 스킨/타입 기준 강력 분기
  const isGallery = boardInfo.type === 'gallery' || boardInfo.skin === 'gallery';

  if (action === 'write') {
    return isGallery
      ? <GalleryWrite boardInfo={boardInfo} />
      : <BoardWrite boardInfo={boardInfo} />;
  }
  if (action === 'detail' && post_id) {
    return isGallery
      ? <GalleryDetail boardInfo={boardInfo} postId={post_id} />
      : <BoardDetail boardInfo={boardInfo} postId={post_id} />;
  }
  // 목록
  return isGallery
    ? <GalleryBoard boardInfo={boardInfo} />
    : <BoardList boardInfo={boardInfo} />;
}

export default BoardScreen;
