import mysql from 'mysql2/promise';
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
export default pool;
export async function getDb() {
  return pool;
}

// 게시판 목록 조회 함수
export async function getBoardList({ board_id = '', page = 1, searchType = 'title', searchKeyword = '' }) {

  const PAGE_SIZE = 20;
  const offset = (page - 1) * PAGE_SIZE;
  if (!board_id) throw new Error('board_id가 필요합니다');
  const tableName = `g5_write_${board_id}`;
  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (searchKeyword) {
    if (searchType === 'title') {
      where += ' AND title LIKE ?';
      params.push(`%${searchKeyword}%`);
    } else if (searchType === 'content') {
      where += ' AND content LIKE ?';
      params.push(`%${searchKeyword}%`);
    }
  }
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT id, title, author, created_at, view_count, name, nickname FROM ${tableName} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, offset]
    );
    const [countRows] = await conn.query(
      `SELECT COUNT(*) as count FROM ${tableName} ${where}`,
      params
    );
    const totalPages = Math.ceil((countRows as any)[0].count / PAGE_SIZE);
    return { boards: rows, totalPages };
  } finally {
    conn.release();
  }
}

// 게시글 작성
export async function writeBoard({ 
  board_id, 
  title, 
  content, 
  author, 
  name, 
  password, 
  nickname, 
  files, 
  links 
}: { 
  board_id: string; 
  title: string; 
  content: string; 
  author: string; 
  name?: string; 
  password?: string; 
  nickname?: string; 
  files?: any; 
  links?: any 
}) {
  const tableName = `g5_write_${board_id}`;
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(
      `INSERT INTO ${tableName} (title, content, author, name, password, nickname, files, links, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title, 
        content, 
        author, 
        name || null, 
        password || null, 
        nickname || null, 
        JSON.stringify(files || []), 
        JSON.stringify(links || [])
      ]
    );
    return result;
  } finally {
    conn.release();
  }
}

// 게시글 상세
export async function getBoardDetail({ board_id, post_id }: { board_id: string; post_id: string }) {
  if (!board_id || !post_id) return null;
  const tableName = `g5_write_${board_id}`;
  const conn = await pool.getConnection();
  try {
    // 조회수 증가
    await conn.query(`UPDATE ${tableName} SET view_count = view_count + 1 WHERE id = ?`, [post_id]);
    // 게시글 상세
    const [rows] = await conn.query(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [post_id]
    );
    const detail = (rows as any)[0] || null;
    if (!detail) return null;

    // 첨부파일 파싱 (files 컬럼이 있다면)
    let files = [];
    if (detail.files) {
      try {
        files = JSON.parse(detail.files);
      } catch {
        files = Array.isArray(detail.files) ? detail.files : [];
      }
    }
    detail.files = files;

    // 댓글 조회 (g5_comments_{board_id} 테이블)
    let comments = [];
    try {
      const commentTable = `g5_comments_${board_id}`;
      const [commentRows] = await conn.query(
        `SELECT * FROM ${commentTable} WHERE post_id = ? ORDER BY id ASC`,
        [post_id]
      );
      comments = commentRows as any[];
    } catch {
      comments = [];
    }
    detail.comments = comments;

    return detail;
  } finally {
    conn.release();
  }
}

// 댓글 작성
export async function writeComment({ post_id, author, content, password }: { post_id: string; author: string; content: string; password: string }) {
  const conn = await pool.getConnection();
  try {
    // 비회원 비밀번호 해시 처리 필요 (예시: plain 저장)
    const [result] = await conn.query(
      'INSERT INTO comments (post_id, author, content, password, created_at) VALUES (?, ?, ?, ?, NOW())',
      [post_id, author, content, password]
    );
    return result;
  } finally {
    conn.release();
  }
}

// 갤러리형 게시판 목록
export async function getGalleryBoardList({ board_id = '', page = 1, searchType = '', searchKeyword = '' }) {
  const PAGE_SIZE = 20;
  const offset = (page - 1) * PAGE_SIZE;
  if (!board_id) throw new Error('board_id가 필요합니다');
  const tableName = `g5_write_${board_id}`;
  const conn = await pool.getConnection();
  
  // 검색 조건 추가
  let where = '1=1';
  const params: any[] = [];
  if (searchKeyword && searchType) {
    if (searchType === 'title') {
      where += ' AND title LIKE ?';
      params.push(`%${searchKeyword}%`);
    } else if (searchType === 'content') {
      where += ' AND content LIKE ?';
      params.push(`%${searchKeyword}%`);
    }
  }
  
  try {
    // files 컬럼 전체를 가져와서 처리
    const [rows] = await conn.query(
      `SELECT id, title, files, author, created_at, view_count FROM ${tableName} WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, offset]
    );
    
    // 검색 조건에 맞는 총 게시글 수 조회
    const [countRows] = await conn.query(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE ${where}`,
      params
    );
    
    // 첨부파일 중 이미지 파일을 추출하여 썸네일로 사용
    const itemsWithThumbnail = (rows as any[]).map(item => {
      let thumbnailUrl = '';
      let files = item.files;
      
      // files가 문자열이면 JSON으로 파싱
      if (typeof files === 'string') {
        try {
          files = JSON.parse(files);
        } catch (e) {
          files = [];
        }
      }
      
      // 첨부파일 중 이미지 파일 찾기
      if (Array.isArray(files) && files.length > 0) {
        const imageFile = files.find((file: any) => {
          if (!file) return false;
          const url = file.downloadUrl || file.url || '';
          const name = file.originalName || file.fileName || url;
          const lowered = String(url || name).toLowerCase();
          return /(\.jpg|\.jpeg|\.png|\.gif|\.webp)$/i.test(lowered);
        });
        
        if (imageFile) {
          thumbnailUrl = imageFile.downloadUrl || imageFile.url || '';
        }
      }
      
      return {
        ...item,
        thumbnail: thumbnailUrl,
        files
      };
    });
    
    const totalPages = Math.ceil((countRows as any)[0].count / PAGE_SIZE);
    return { items: itemsWithThumbnail, totalPages };
  } finally {
    conn.release();
  }
}
