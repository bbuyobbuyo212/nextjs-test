"use client";
import BoardList from "../components/board/BoardList";

export default function Home() {
  return (
    <>
    <BoardList boardInfo={{ id: "notice" }} />
    </>
  );
}
