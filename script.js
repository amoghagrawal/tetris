const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const bgMusic = document.getElementById('bgMusic');
    let blockSize;
    let cols;
    let rows;
    let board = [];
    
    function initializeCanvas() {
        if (window.innerWidth <= 768) {
            canvas.width = 200;
            canvas.height = 400;
        } else {
            canvas.width = 250;
            canvas.height = 500;
        }
        blockSize = canvas.width / 10;
        cols = canvas.width / blockSize;
        rows = canvas.height / blockSize;
        board = Array(rows).fill().map(() => Array(cols).fill(0));
    }
    
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameOver = false;
    let currentPiece = null;
    let lastTime = 0;
    
    const colors = [
        null,
        '#FF0D72',
        '#0DC2FF',
        '#0DFF72',
        '#F538FF',
        '#FF8E0D',
        '#FFE138',
        '#3877FF'
    ];
    
    const pieces = [
        [[1, 1, 1, 1]],
        [[2, 0, 0], [2, 2, 2]],
        [[0, 0, 3], [3, 3, 3]],
        [[4, 4], [4, 4]],
        [[0, 5, 5], [5, 5, 0]],
        [[0, 6, 0], [6, 6, 6]],
        [[7, 7, 0], [0, 7, 7]]
    ];
    
    function createPiece() {
        const piece = pieces[Math.floor(Math.random() * pieces.length)];
        return {
            pos: {x: Math.floor(cols/2) - Math.floor(piece[0].length/2), y: 0},
            matrix: piece,
            color: piece[0].find(val => val !== 0)
        };
    }
    
    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = colors[value];
                    ctx.fillStyle = colors[value];
                    ctx.fillRect((x + offset.x) * blockSize, 
                               (y + offset.y) * blockSize, 
                               blockSize - 1, 
                               blockSize - 1);
                    ctx.shadowBlur = 0;
                }
            });
        });
    }
    
    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        drawMatrix(board, {x: 0, y: 0});
        if (currentPiece) {
            drawMatrix(currentPiece.matrix, currentPiece.pos);
        }
    }
    
    function collide(board, piece) {
        const [m, o] = [piece.matrix, piece.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (board[y + o.y] &&
                    board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function merge(board, piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + piece.pos.y][x + piece.pos.x] = value;
                }
            });
        });
    }
    
    function playerMove(dir) {
        currentPiece.pos.x += dir;
        if (collide(board, currentPiece)) {
            currentPiece.pos.x -= dir;
        }
    }
    
    function playerDrop() {
        currentPiece.pos.y++;
        if (collide(board, currentPiece)) {
            currentPiece.pos.y--;
            merge(board, currentPiece);
            checkLines();
            resetPiece();
        }
    }
    
    function playerHardDrop() {
        while (!collide(board, currentPiece)) {
            currentPiece.pos.y++;
        }
        currentPiece.pos.y--;
        merge(board, currentPiece);
        checkLines();
        resetPiece();
    }
    
    function checkLines() {
        let linesCleared = 0;
        outer: for (let y = board.length - 1; y > 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y;
            linesCleared++;
        }
        if (linesCleared > 0) {
            lines += linesCleared;
            score += linesCleared * 100 * level;
            level = Math.floor(lines / 10) + 1;
            updateScore();
        }
    }
    
    function updateScore() {
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = lines;
    }
    
    function resetPiece() {
        currentPiece = createPiece();
        if (collide(board, currentPiece)) {
            gameOver = true;
            document.getElementById('game-over').style.display = 'block';
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
    }
    
    function reset() {
        initializeCanvas();
        score = 0;
        level = 1;
        lines = 0;
        gameOver = false;
        document.getElementById('game-over').style.display = 'none';
        updateScore();
        resetPiece();
        bgMusic.loop = true;
        bgMusic.play().catch(e => console.log("Audio autoplay prevented:", e));
    }
    
    document.addEventListener('keydown', event => {
        if (gameOver) {
            if (event.keyCode === 13) {
                reset();
            }
        } else {
            switch(event.keyCode) {
                case 37:
                    playerMove(-1);
                    break;
                case 39:
                    playerMove(1);
                    break;
                case 40:
                    playerDrop();
                    break;
                case 32:
                    playerHardDrop();
                    break;
            }
        }
    });
    
    document.getElementById('reset').addEventListener('click', reset);
    
    window.addEventListener('resize', () => {
        initializeCanvas();
        reset();
    });
    
    function update(time = 0) {
        const dropInterval = 1000 - (level * 50);
        const deltaTime = time - lastTime;
        lastTime = time;
        
        if (!gameOver) {
            if (deltaTime > dropInterval) {
                playerDrop();
                lastTime = time;
            }
            draw();
        }
        requestAnimationFrame(update);
    }
    
    reset();
    update();