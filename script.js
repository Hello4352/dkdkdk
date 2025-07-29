const boardEl = document.getElementById("board");
const modal = document.getElementById("promotion-modal");
const optionsEl = document.getElementById("promotion-options");
const game = new Chess();

const PIECES = {
  r: "♜", n: "♞", b: "♝", q: "♛", k: "♚", p: "♟",
  R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔", P: "♙",
};

let selectedSquare = null;
let legalMoves = [];

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
      const squareName = file + rank;

      square.dataset.square = squareName;

      const piece = board[i][j];
      if (piece) square.textContent = PIECES[piece.color === "w" ? piece.type.toUpperCase() : piece.type];

      if (squareName === selectedSquare) square.classList.add("selected");
      if (legalMoves.includes(squareName)) square.classList.add("highlight");

      square.addEventListener("click", () => onSquareClick(squareName));
      boardEl.appendChild(square);
    }
  }
}

function onSquareClick(square) {
  if (selectedSquare && legalMoves.includes(square)) {
    const moves = game.moves({ square: selectedSquare, verbose: true });
    const move = moves.find(m => m.to === square);

    if (move.promotion) {
      showPromotionDialog(move);
    } else {
      game.move({ from: selectedSquare, to: square });
      selectedSquare = null;
      legalMoves = [];
      checkGameOver();
    }
  } else {
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      selectedSquare = square;
      legalMoves = game.moves({ square, verbose: true }).map(m => m.to);
    } else {
      selectedSquare = null;
      legalMoves = [];
    }
  }
  renderBoard();
}

function showPromotionDialog(move) {
  modal.classList.remove("hidden");
  optionsEl.innerHTML = "";

  ["q", "r", "b", "n"].forEach(piece => {
    const span = document.createElement("span");
    span.textContent = PIECES[game.turn() === "w" ? piece.toUpperCase() : piece];
    span.addEventListener("click", () => {
      game.move({ from: move.from, to: move.to, promotion: piece });
      modal.classList.add("hidden");
      selectedSquare = null;
      legalMoves = [];
      renderBoard();
      checkGameOver();
    });
    optionsEl.appendChild(span);
  });
}

function checkGameOver() {
  if (game.in_checkmate()) {
    alert("체크메이트! " + (game.turn() === "w" ? "흑" : "백") + " 승리!");
  } else if (game.in_draw()) {
    alert("무승부입니다!");
  }
}

renderBoard();
