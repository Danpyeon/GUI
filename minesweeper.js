document.addEventListener("DOMContentLoaded", () => {
    const nickname = localStorage.getItem("nickname") || "플레이어";
    const gameBoard = document.getElementById("board");
    const mineCounter = document.getElementById("mine-counter");
    const timerDisplay = document.getElementById("timer");
    const levelSelector = document.getElementById("level");
    const startGameButton = document.getElementById("start-game");
    const gameContainer = document.getElementById("game-board");

    let rows, cols, mineCount;
    let boardState = [];
    let mines = [];
    let revealedCells = 0;
    let flags = 0;
    let timer = 0;
    let timerInterval;

    // 닉네임 표시
    document.getElementById("nickname").textContent = nickname;

    // 난이도 설정
    function setDifficulty() {
        const difficulty = levelSelector.value;
        if (difficulty === "easy") {
            rows = 9;
            cols = 9;
            mineCount = 10;
        } else if (difficulty === "medium") {
            rows = 16;
            cols = 16;
            mineCount = 40;
        } else if (difficulty === "hard") {
            rows = 16;
            cols = 30;
            mineCount = 99;
        }
    }

    // 지뢰 배치
    function generateMines() {
        let mineSet = new Set();
        while (mineSet.size < mineCount) {
            const index = Math.floor(Math.random() * rows * cols);
            mineSet.add(index);
        }
        mines = Array.from(mineSet);

        boardState = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(0));

        for (let mine of mines) {
            const r = Math.floor(mine / cols);
            const c = mine % cols;
            boardState[r][c] = "X";

            // 주변 칸 숫자 증가
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (
                        nr >= 0 &&
                        nr < rows &&
                        nc >= 0 &&
                        nc < cols &&
                        boardState[nr][nc] !== "X"
                    ) {
                        boardState[nr][nc]++;
                    }
                }
            }
        }
    }

    // 게임 보드 렌더링
    function renderBoard() {
        gameBoard.innerHTML = "";
        gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener("click", onCellClick);
                cell.addEventListener("contextmenu", onCellRightClick);
                gameBoard.appendChild(cell);
            }
        }
    }

    // 타이머 시작
    function startTimer() {
        timer = 0;
        timerDisplay.textContent = "0";
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer++;
            timerDisplay.textContent = timer.toString();
        }, 1000);
    }

    // 칸 클릭 이벤트
    function onCellClick(event) {
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (cell.classList.contains("opened") || cell.classList.contains("flag")) {
            return;
        }

        if (boardState[row][col] === "X") {
            cell.classList.add("mine");
            gameOver(false);
        } else {
            revealCell(cell, row, col);
        }
    }

    // 칸 우클릭 이벤트
    function onCellRightClick(event) {
        event.preventDefault();
        const cell = event.target;
        if (cell.classList.contains("opened")) return;

        if (cell.classList.contains("flag")) {
            cell.classList.remove("flag");
            flags--;
        } else if (flags < mineCount) {
            cell.classList.add("flag");
            flags++;
        }
        mineCounter.textContent = `남은 지뢰: ${mineCount - flags}`;
    }

    // 칸 열기
    function revealCell(cell, row, col) {
        if (
            row < 0 ||
            row >= rows ||
            col < 0 ||
            col >= cols ||
            cell.classList.contains("opened")
        ) {
            return;
        }

        cell.classList.add("opened");
        revealedCells++;

        if (boardState[row][col] > 0) {
            cell.textContent = boardState[row][col];
            cell.classList.add(`cell-${boardState[row][col]}`);
        } else {
            // 0일 경우 주변 칸 열기
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    const neighbor = document.querySelector(
                        `[data-row="${nr}"][data-col="${nc}"]`
                    );
                    if (neighbor) revealCell(neighbor, nr, nc);
                }
            }
        }

        if (revealedCells === rows * cols - mineCount) {
            gameOver(true);
        }
    }

    // 게임 종료
    function gameOver(isWin) {
        clearInterval(timerInterval);
        alert(isWin ? "축하합니다! 게임 클리어!" : "게임 오버!");
        gameContainer.style.display = "none";
    }

    // 게임 시작
    startGameButton.addEventListener("click", () => {
        setDifficulty();
        generateMines();
        renderBoard();
        startTimer();
        gameContainer.style.display = "block";
        mineCounter.textContent = `남은 지뢰: ${mineCount}`;
    });
});
