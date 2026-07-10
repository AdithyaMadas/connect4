export type Cell = 0 | 1 | 2;
export type Board = Cell[][]; // 6 rows x 7 cols, row 0 = top, row 5 = bottom

export const ROWS = 6;
export const COLS = 7;

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0) as Cell[]);
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Drops a piece into a column. Returns the row it landed on, or -1 if the column is full. */
export function dropPiece(board: Board, col: number, player: Cell): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === 0) {
      board[row][col] = player;
      return row;
    }
  }
  return -1;
}

export function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== 0);
}

export function checkWin(board: Board, row: number, col: number): boolean {
  const player = board[row][col];
  if (!player) return false;

  const directions: [number, number][] = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    const count =
      1 + countDir(board, row, col, dr, dc, player) + countDir(board, row, col, -dr, -dc, player);
    if (count >= 4) return true;
  }
  return false;
}

function countDir(
  board: Board,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: Cell
): number {
  let r = row + dr;
  let c = col + dc;
  let count = 0;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }
  return count;
}
