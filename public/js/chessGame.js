
const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
const turnIndicator = document.querySelector('.turn-indicator');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let selectedSquare = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    
    updateTurnIndicator();
    
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add(
                'square',
                (rowindex + squareindex) % 2 === 0 ? 'light' : 'dark'
            );
            
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;
            
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add(
                    'piece',
                    square.color === 'w' ? 'white' : 'black'
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                
                pieceElement.addEventListener("click", (e) => {
                    if (playerRole === square.color && chess.turn() === square.color) {
                        clearHighlights();
                        selectedSquare = { row: rowindex, col: squareindex };
                        highlightPossibleMoves(rowindex, squareindex);
                        squareElement.classList.add('selected');
                    }
                });
                
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", "");
                        pieceElement.style.opacity = "0.5";
                        
                        clearHighlights();
                        highlightPossibleMoves(rowindex, squareindex);
                    }
                });
                
                pieceElement.addEventListener("dragend", (e) => {
                    pieceElement.style.opacity = "1";
                    draggedPiece = null;
                    sourceSquare = null;
                    clearHighlights();
                });
                
                squareElement.appendChild(pieceElement);
            }
            
            squareElement.addEventListener('click', (e) => {
                if (selectedSquare && !e.target.classList.contains('piece')) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(selectedSquare, targetSquare);
                    selectedSquare = null;
                    clearHighlights();
                }
            });
            
            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            });
            
            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                    clearHighlights();
                }
            });
            
            boardElement.appendChild(squareElement);
        });
    });
    
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove('flipped');
    }
};

const updateTurnIndicator = () => {
    if (!turnIndicator) return;
    
    const currentTurn = chess.turn();
    const turnText = currentTurn === 'w' ? 'White' : 'Black';
    
    turnIndicator.innerHTML = `<strong>Current Turn:</strong> ${turnText}`;
    turnIndicator.className = 'turn-indicator ' + (currentTurn === 'w' ? 'white-turn' : 'black-turn');
    
    if (playerRole === currentTurn) {
        turnIndicator.innerHTML += ' <span class="your-turn">(Your Turn!)</span>';
    }
};

const highlightPossibleMoves = (row, col) => {
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const moves = chess.moves({ square: square, verbose: true });
    
    moves.forEach(move => {
        const targetCol = move.to.charCodeAt(0) - 97;
        const targetRow = 8 - parseInt(move.to[1]);
        
        const targetSquare = document.querySelector(
            `[data-row="${targetRow}"][data-col="${targetCol}"]`
        );
        
        if (targetSquare) {
            if (move.captured) {
                targetSquare.classList.add('capture-highlight');
            } else {
                targetSquare.classList.add('possible-move');
            }
        }
    });
};

const clearHighlights = () => {
    document.querySelectorAll('.possible-move').forEach(el => {
        el.classList.remove('possible-move');
    });
    document.querySelectorAll('.capture-highlight').forEach(el => {
        el.classList.remove('capture-highlight');
    });
    document.querySelectorAll('.selected').forEach(el => {
        el.classList.remove('selected');
    });
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    };
    
    const tempMove = chess.move(move);
    
    if (tempMove) {
        socket.emit('move', move);
        clearHighlights();
    } else {
        console.log("Invalid move attempted");
        renderBoard();
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        K: "♔",
        Q: "♕",
        R: "♖",
        B: "♗",
        N: "♘",
        P: "♙",
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟"
    };
    
    return unicodePieces[piece.type.toUpperCase()] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", (message) => {
    console.log("Invalid move:", message);
    renderBoard();
});

socket.on("gameOver", (result) => {
    console.log("Game Over:", result);
    setTimeout(() => {
        alert(`Game Over! ${result}`);
    }, 100);
});


renderBoard();