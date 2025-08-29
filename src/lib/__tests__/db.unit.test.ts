import { getBoardList } from '../db';

jest.mock('mysql2/promise', () => {
  const mockConn = {
    query: jest.fn().mockImplementation((sql, params) => {
      if (sql.includes('SELECT id, title')) {
        return [[{ id: 1, title: '테스트', author: '홍길동', created_at: '2025-08-27T12:00:00Z', view_count: 10 }]];
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

describe('getBoardList', () => {
  it('should return board list and totalPages', async () => {
    const result = await getBoardList({ board_id: 'test', page: 1 });
  expect((result.boards as any[])[0].title).toBe('테스트');
    expect(result.totalPages).toBe(1);
  });
});
