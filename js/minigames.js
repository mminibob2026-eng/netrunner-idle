// ===== TIC TAC TOE =====
let ttt = { board:[], turn:'X', over:false, winner:null, grid:null, msg:null };

function tttInit() {
  ttt.board = Array(9).fill('');
  ttt.turn = 'X';
  ttt.over = false;
  ttt.winner = null;
  tttDraw();
}

function tttClick(idx) {
  if (ttt.over || ttt.board[idx] !== '' || ttt.turn !== 'X') return;
  ttt.board[idx] = 'X';
  if (tttCheck()) return;
  ttt.turn = 'O';
  tttDraw();
  setTimeout(tttAI, 300);
}

function tttAI() {
  if (ttt.over) return;
  // Win if possible
  for (let i = 0; i < 9; i++) {
    if (ttt.board[i] !== '') continue;
    ttt.board[i] = 'O';
    if (tttCheckWins('O')) { tttCheck(); tttDraw(); return; }
    ttt.board[i] = '';
  }
  // Block player win
  for (let i = 0; i < 9; i++) {
    if (ttt.board[i] !== '') continue;
    ttt.board[i] = 'X';
    if (tttCheckWins('X')) { ttt.board[i] = 'O'; tttCheck(); tttDraw(); return; }
    ttt.board[i] = '';
  }
  // Take center
  if (ttt.board[4] === '') { ttt.board[4] = 'O'; tttCheck(); tttDraw(); return; }
  // Take corners
  const corners = [0,2,6,8].filter(i => ttt.board[i] === '');
  if (corners.length > 0) {
    ttt.board[corners[Math.floor(Math.random() * corners.length)]] = 'O';
    tttCheck(); tttDraw(); return;
  }
  // Take any empty
  const empty = [];
  for (let i = 0; i < 9; i++) { if (ttt.board[i] === '') empty.push(i); }
  if (empty.length > 0) { ttt.board[empty[Math.floor(Math.random() * empty.length)]] = 'O'; tttCheck(); tttDraw(); }
}

function tttCheckWins(p) {
  const w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return w.some(([a,b,c]) => ttt.board[a] === p && ttt.board[b] === p && ttt.board[c] === p);
}

function tttCheck() {
  if (tttCheckWins('X')) { ttt.over = true; ttt.winner = 'X'; tttReward('win'); return true; }
  if (tttCheckWins('O')) { ttt.over = true; ttt.winner = 'O'; tttDraw(); toast('Tic Tac Toe: AI wins!', 'error'); return true; }
  if (ttt.board.every(c => c !== '')) { ttt.over = true; ttt.winner = 'draw'; tttReward('draw'); return true; }
  return false;
}

function tttReward(result) {
  if (result === 'win') {
    addRes('data', 100); addRes('credits', 50);
    toast('Tic Tac Toe: You win! +100 DATA +50 CREDITS', 'loot');
  } else {
    addRes('data', 20);
    toast('Tic Tac Toe: Draw! +20 DATA', 'loot');
  }
}

function tttDraw() {
  const g = ttt.grid;
  if (!g) return;
  g.innerHTML = '';
  ttt.board.forEach((cell, i) => {
    const d = document.createElement('div');
    d.className = 'ttt-cell' + (cell ? ' ttt-' + cell : '');
    d.textContent = cell;
    if (!cell && !ttt.over && ttt.turn === 'X') {
      d.style.cursor = 'pointer';
      d.addEventListener('click', () => tttClick(i));
    }
    g.appendChild(d);
  });
  const msgs = { 'X': 'Your turn (X)', 'O': 'AI thinking...', '': '' };
  if (ttt.msg) ttt.msg.textContent = ttt.over ? (ttt.winner === 'X' ? 'You win!' : ttt.winner === 'O' ? 'AI wins!' : 'Draw!') : msgs[ttt.turn] || '';
}

// ===== SNAKE =====
let snake = { grid:[], snake:[], food:null, dir:'right', nextDir:'right', score:0, over:false, timer:null, gSize:15, gridEl:null, msgEl:null, interval:150 };

function snakeInit() {
  snake.snake = [{x:7,y:7}];
  snake.dir = 'right';
  snake.nextDir = 'right';
  snake.score = 0;
  snake.over = false;
  snake.food = null;
  if (snake.timer) { clearInterval(snake.timer); snake.timer = null; }
  snakeSpawnFood();
  snakeDraw();
  snake.timer = setInterval(snakeTick, snake.interval);
}

function snakeTick() {
  if (snake.over) return;
  snake.dir = snake.nextDir;
  const head = { ...snake.snake[0] };
  if (snake.dir === 'up') head.y--;
  else if (snake.dir === 'down') head.y++;
  else if (snake.dir === 'left') head.x--;
  else if (snake.dir === 'right') head.x++;
  if (head.x < 0 || head.x >= snake.gSize || head.y < 0 || head.y >= snake.gSize) {
    snakeEnd(); return;
  }
  if (snake.snake.some(s => s.x === head.x && s.y === head.y)) {
    snakeEnd(); return;
  }
  snake.snake.unshift(head);
  if (snake.food && head.x === snake.food.x && head.y === snake.food.y) {
    snake.score++;
    snakeSpawnFood();
  } else {
    snake.snake.pop();
  }
  snakeDraw();
}

function snakeSetDirection(dir) {
  const opposites = { up:'down', down:'up', left:'right', right:'left' };
  if (opposites[dir] !== snake.dir) snake.nextDir = dir;
}

function snakeSpawnFood() {
  const empty = [];
  for (let x = 0; x < snake.gSize; x++) {
    for (let y = 0; y < snake.gSize; y++) {
      if (!snake.snake.some(s => s.x === x && s.y === y)) empty.push({x,y});
    }
  }
  if (empty.length > 0) snake.food = empty[Math.floor(Math.random() * empty.length)];
}

function snakeEnd() {
  snake.over = true;
  if (snake.timer) { clearInterval(snake.timer); snake.timer = null; }
  const reward = snake.score * 15;
  addRes('data', reward);
  addRes('credits', Math.floor(reward/3));
  toast('Snake: Score ' + snake.score + '! +' + reward + ' DATA +' + Math.floor(reward/3) + ' CREDITS', 'loot');
  snakeDraw();
}

function snakeDraw() {
  const g = snake.gridEl;
  if (!g) return;
  const cellSize = Math.min(20, Math.floor((g.clientWidth - 4) / snake.gSize));
  g.innerHTML = '';
  g.style.gridTemplateColumns = 'repeat(' + snake.gSize + ',' + cellSize + 'px)';
  g.style.gridTemplateRows = 'repeat(' + snake.gSize + ',' + cellSize + 'px)';
  for (let y = 0; y < snake.gSize; y++) {
    for (let x = 0; x < snake.gSize; x++) {
      const d = document.createElement('div');
      d.style.width = cellSize + 'px';
      d.style.height = cellSize + 'px';
      if (snake.snake.some(s => s.x === x && s.y === y)) {
        d.className = 'snake-cell snake-body';
        if (snake.snake[0].x === x && snake.snake[0].y === y) d.className = 'snake-cell snake-head';
      } else if (snake.food && snake.food.x === x && snake.food.y === y) {
        d.className = 'snake-cell snake-food';
      } else {
        d.className = 'snake-cell snake-empty';
      }
      g.appendChild(d);
    }
  }
  if (snake.msgEl) snake.msgEl.textContent = snake.over ? 'Game Over! Score: ' + snake.score : 'Score: ' + snake.score + (snake.over ? '' : ' | Arrow keys to move');
}

// Keyboard listener for snake
document.addEventListener('keydown', function(e) {
  const keyMap = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
  const dir = keyMap[e.key];
  if (dir) { e.preventDefault(); snakeSetDirection(dir); }
});
