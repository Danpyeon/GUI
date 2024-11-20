document.addEventListener("DOMContentLoaded", () => {
    const startGameButton = document.getElementById('start-game');
    if (startGameButton) {
        startGameButton.onclick = function () {
            const level = document.getElementById('level').value;
            localStorage.setItem('level', level);
            window.location.href = 'minesweeper_gamePlay.html'; // 게임 플레이 페이지로 이동
        };

        // 닉네임을 표시
        const nickname = localStorage.getItem("nickname") || "플레이어";
        document.getElementById('nickname').textContent = nickname;
        return;
    }

    const gameBoard = document.getElementById("board");
    const mineCounter = document.getElementById("mine-counter");
    const timerDisplay = document.getElementById("timer");
    const level = localStorage.getItem("level") || "easy";

    let rows, cols, mineCount;
    let boardState = [];
    let mines = [];
    let revealedCells = 0;
    let flags = 0;
    let timer = 0;
    let timerInterval;

    // 난이도 설정
    function setDifficulty() {
        if (level === "easy") {
            rows = 9;
            cols = 9;
            mineCount = 10;
        } else if (level === "medium") {
            rows = 16;
            cols = 16;
            mineCount = 40;
        } else if (level === "hard") {
            rows = 16;
            cols = 30;
            mineCount = 99;
        }
        console.log(`난이도 설정: ${level}, 행: ${rows}, 열: ${cols}, 지뢰 수: ${mineCount}`);
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
        console.log("지뢰 배치 완료:", boardState);
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
                cell.addEventListener("dblclick", onCellDoubleClick);
                gameBoard.appendChild(cell);
            }
        }
        console.log("게임 보드 렌더링 완료");
    }

    // 칸 우클릭 이벤트 (깃발 및 물음표 표시)
    function onCellRightClick(event) {
        event.preventDefault();
        const cell = event.target;
        if (cell.classList.contains("opened")) return;

        if (cell.classList.contains("flag")) {
            cell.classList.remove("flag");
            cell.classList.add("question");
            cell.textContent = '❓';  // 물음표 추가
            flags--;
        } else if (cell.classList.contains("question")) {
            cell.classList.remove("question");
            cell.textContent = '';  // 물음표 제거
        } else if (flags < mineCount) {
            cell.classList.add("flag");
            cell.textContent = '🚩';  // 깃발 추가
            flags++;
        }
        mineCounter.textContent = `남은 지뢰: ${mineCount - flags}`;
    }

    // 칸 클릭 이벤트
    function onCellClick(event) {
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (cell.classList.contains("opened") || cell.classList.contains("flag") || cell.classList.contains("question")) {
            return;
        }

        if (boardState[row][col] === "X") {
            cell.classList.add("mine");
            cell.textContent = '💣'; // 지뢰 표시
            gameOver(false);
        } else {
            revealCell(cell, row, col);
        }
    }

    // 숫자 칸 더블 클릭 이벤트 - 주변 칸 열기
    function onCellDoubleClick(event) {
        const cell = event.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!cell.classList.contains("opened") || boardState[row][col] <= 0) {
            return;
        }

        let flagCount = 0;
        let neighbors = [];

        // 주변 칸 검사
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    const neighbor = document.querySelector(`[data-row="${nr}"][data-col="${nc}"]`);
                    neighbors.push(neighbor);
                    if (neighbor && neighbor.classList.contains("flag")) {
                        flagCount++;
                    }
                }
            }
        }

        // 주변 깃발 개수가 숫자와 같을 때 주변 칸 열기
        if (flagCount === boardState[row][col]) {
            neighbors.forEach(neighbor => {
                if (neighbor && !neighbor.classList.contains("flag") && !neighbor.classList.contains("opened")) {
                    const nr = parseInt(neighbor.dataset.row);
                    const nc = parseInt(neighbor.dataset.col);
                    if (boardState[nr][nc] === "X") {
                        neighbor.classList.add("mine");
                        neighbor.textContent = '💣'; // 지뢰 표시
                        gameOver(false);
                    } else {
                        revealCell(neighbor, nr, nc);
                    }
                }
            });
        }
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
        cell.textContent = '';  // 기존 텍스트 제거
        revealedCells++;

        if (boardState[row][col] > 0) {
            cell.textContent = boardState[row][col];
            cell.classList.add(`cell-${boardState[row][col]}`);
        } else {
            // 0    일 경우 주변 칸 열기
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
        window.location.href = 'minesweeper_game_level.html'; // 게임 종료 후 난이도 선택 페이지로 이동
    }

    // 게임 시작
    try {
        setDifficulty();
        generateMines();
        renderBoard();
        startTimer();
        mineCounter.textContent = `남은 지뢰: ${mineCount}`;
    } catch (error) {
        console.error("게임 초기화 중 오류 발생:", error);
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
        console.log("타이머 시작");
    }
});
