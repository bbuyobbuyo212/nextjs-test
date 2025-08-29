import { getBoardDetail } from '../db';

jest.mock('mysql2/promise', () => {
  const mockConn = {
    query: jest.fn().mockImplementation((sql, params) => {
      if (sql.includes('SELECT * FROM boards')) {
        return [[{ id: 1, board_id: 'test', title: '상세', content: '본문', author: '홍길동', created_at: '2025-08-27T12:00:00Z', view_count: 20 }]];
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

describe('getBoardDetail', () => {
  it('should return board detail', async () => {
    const result = await getBoardDetail({ board_id: 'test', post_id: '1' });
    expect(result.title).toBe('상세');
    expect(result.content).toBe('본문');
    expect(result.author).toBe('홍길동');
  });

  it('should return null if not found', async () => {
    // mock empty result
    const { getConnection } = require('mysql2/promise').createPool();
    getConnection().query.mockImplementationOnce(() => [[]]);
    const result = await getBoardDetail({ board_id: 'test', post_id: '999' });
    expect(result).toBeNull();
  });
});
