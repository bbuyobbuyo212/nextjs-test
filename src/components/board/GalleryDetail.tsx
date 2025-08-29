"use client";
import React from 'react';
import BoardDetail from './BoardDetail';

function GalleryDetail({ boardInfo, postId }: { boardInfo?: any; postId?: string }) {
  // 갤러리 상세는 리스트형 상세와 동일한 데이터/기능을 사용
  return <BoardDetail boardInfo={boardInfo} postId={postId} />;
}

export default GalleryDetail;
