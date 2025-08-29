import { writeBoard } from '../db';

jest.mock('mysql2/promise', () => {
  const mockConn = {
    query: jest.fn().mockImplementation((sql, params) => {
      if (sql.startsWith('INSERT INTO boards')) {
        return [{ insertId: 123 }];
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

describe('writeBoard', () => {
  it('should insert board and return result', async () => {
    const result = await writeBoard({ board_id: 'test', title: '글제목', content: '글내용', author: '홍길동' });
    expect(result.board_id).toBe(123);
  });
});
