// 게시판 및 관련 테이블을 board_id로 직접 삭제하는 자동화 스크립트
// 사용법: node deleteBoard.js <board_id>

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost', // DB 호스트
  user: 'root',     // DB 사용자
  password: '비밀번호', // DB 비밀번호
  database: 'DB명'  // DB 이름
};

async function deleteBoard(board_id) {
  const db = await mysql.createConnection(DB_CONFIG);
  try {
    // 게시글 테이블 삭제
    await db.execute(`DROP TABLE IF EXISTS \`g5_write_${board_id}\``);
    // 댓글 테이블 삭제
    await db.execute(`DROP TABLE IF EXISTS \`g5_comments_${board_id}\``);
    // boards_meta에서 삭제
    await db.execute('DELETE FROM boards_meta WHERE board_id = ?', [board_id]);
    console.log(`게시판 및 관련 테이블 삭제 완료: ${board_id}`);
  } catch (err) {
    console.error('삭제 중 오류:', err.message);
  } finally {
    await db.end();
  }
}

const board_id = process.argv[2];
if (!board_id) {
  console.error('board_id를 입력하세요. 예: node deleteBoard.js att');
  process.exit(1);
}
deleteBoard(board_id);
