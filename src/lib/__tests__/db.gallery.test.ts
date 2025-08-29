import { getGalleryBoardList } from '../db';

jest.mock('mysql2/promise', () => {
  const mockConn = {
    query: jest.fn().mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, title, image')) {
        return [[{ id: 1, title: '갤러리', image: '/img.jpg', author: '홍길동', created_at: '2025-08-27T12:00:00Z', view_count: 5 }]];
      }
      if (sql.includes('SELECT COUNT(*)')) {
        return [[{ count: 1 }]];
      }
      return [[]];
    }),
    release: jest.fn(),
  };
  return {
    createPool: jest.fn(() => ({
      getConnection: jest.fn(() => mockConn),
    })),
  };
});

describe('getGalleryBoardList', () => {
  it('should return gallery board list and totalPages', async () => {
    const result = await getGalleryBoardList({ board_id: 'test', page: 1 });
    expect((result.items as any[])[0].title).toBe('갤러리');
    expect(result.totalPages).toBe(1);
  });
});
