"use client";
import React from 'react';
import BoardWrite from './BoardWrite';

function GalleryWrite({ boardInfo, searchParams }: { boardInfo?: any; searchParams?: any }) {
  // 갤러리 쓰기도 리스트형 쓰기와 동일한 기능을 사용
  return <BoardWrite boardInfo={boardInfo} searchParams={searchParams} />;
}

export default GalleryWrite;
