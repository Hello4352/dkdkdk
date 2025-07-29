const boardEl = document.getElementById("board");
const promotionModal = document.getElementById("promotion-modal");
const promotionOptions = document.getElementById("promotion-options");
const skillSelect = document.getElementById("skill");

const PIECES = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
};

const game = new Chess();
let selectedSquare = null;
let legalMoves = [];
let waitingForPromotion = null;
let turn = "human"; // 'human' or 'ai'

// Stockfish AI 초기화
const stockfish = STOCKFISH();

stockfish.onmessage = (event) => {
  const line = event.data || event;
  if (line.startsWith("bestmove")) {
    const bestMove = line.split(" ")[1];
    makeAIMove(bestMove);
  }
};

function renderBoard() {
  boardEl.innerHTML = "";
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((i + j) % 2 === 0 ? "white" : "black");

      const file = "abcdefgh"[j];
      const rank = 8 - i;
      const sq = file + rank;

      square.dataset.square = sq;

      const piece = board[i][j];
      if (piece) {
        const symbol = PIECES[piece.color === "w" ? piece.type.toUpperCase() : piece.type];
        square.textContent = symbol;
      }

      if (sq === selectedSquare) square.classList.add("selected");
      if (legalMoves.includes(sq)) square.classList.add("highlight");

      square.addEventListener("click", () => onSquareClick(sq));
      boardEl.appendChild(square);
    }
  }
}

function onSquareClick(square) {
  if (turn !== "human") return;

  if (waitingForPromotion) return; // 프로모션 중엔 클릭 무시

  const piece = game.get(square);
  if (selectedSquare) {
    if (legalMoves.includes(square)) {
      // 프로모션 체크
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const move = moves.find((m) => m.to === square);
      if (move.promotion) {
        waitingForPromotion = { from: selectedSquare, to: square };
        showPromotionDialog();
      } else {
        game.move({ from: selectedSquare, to: square });
        endHumanTurn();
      }
      selectedSquare = null;
      legalMoves = [];
      renderBoard();
      return;
    }
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
  } else {
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      legalMoves = game.moves({ square, verbose: true }).map((m) => m.to);
      renderBoard();
    }
  }
}

function showPromotionDialog() {
  promotionModal.classList.remove("hidden");
  promotionOptions.innerHTML = "";
  ["q", "r", "b", "n"].forEach((p) => {
    const span = document.createElement("span");
    span.textContent = PIECES[game.turn() === "w" ? p.toUpperCase() : p];
    span.title = p;
    span.addEventListener("click", () => {
      if (!waitingForPromotion) return;
      game.move({ from: waitingForPromotion.from, to: waitingForPromotion.to, promotion: p });
      waitingForPromotion = null;
      promotionModal.classList.add("hidden");
      endHumanTurn();
      renderBoard();
    });
    promotionOptions.appendChild(span);
  });
}

function endHumanTurn() {
  turn = "ai";
  if (game.game_over()) {
    showGameOverAlert();
    return;
  }
  requestAIMove();
}

function requestAIMove() {
  const skill = parseInt(skillSelect.value, 10);
  stockfish.postMessage("uci");
  stockfish.postMessage(`setoption name Skill Level value ${skill}`);
  stockfish.postMessage(`position fen ${game.fen()}`);
  stockfish.postMessage("go movetime 1000"); // 1초 생각
}

function makeAIMove(move) {
  game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: move.length > 4 ? move[4] : undefined });
  renderBoard();
  if (game.game_over()) {
    showGameOverAlert();
  } else {
    turn = "human";
  }
}

function showGameOverAlert() {
  if (game.in_checkmate()) {
    alert((game.turn() === "w" ? "흑" : "백") + " 체크메이트! 게임 종료.");
  } else if (game.in_draw()) {
    alert("무승부입니다.");
  } else if (game.in_stalemate()) {
    alert("스테일메이트입니다.");
  }
}

renderBoard();
