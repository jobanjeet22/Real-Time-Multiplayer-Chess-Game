const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
const turnIndicator = document.querySelector('.turn-indicator');
const statusMessage = document.querySelector('.status-message');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let selectedSquare = null;
let gameStarted = false;
let moveHistory = [];

const playMoveSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGJ0fPTgjMGHm7A7+OZURE');
    audio.play().catch(e => {});
};

const playCaptureSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
    audio.volume = 0.6;
    audio.play().catch(e => {});
};

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    updateTurnIndicator();
    
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowindex + squareindex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;
            
            if (squareindex === 0) {
                const rankLabel = document.createElement('div');
                rankLabel.classList.add('rank-label');
                rankLabel.textContent = 8 - rowindex;
                squareElement.appendChild(rankLabel);
            }
            if (rowindex === 7) {
                const fileLabel = document.createElement('div');
                fileLabel.classList.add('file-label');
                fileLabel.textContent = String.fromCharCode(97 + squareindex);
                squareElement.appendChild(fileLabel);
            }
            
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color && gameStarted && chess.turn() === square.color;
                
                if (pieceElement.draggable) {
                    pieceElement.classList.add('draggable');
                }
                
                pieceElement.addEventListener("click", (e) => {
                    e.stopPropagation();
                    
                    if (selectedSquare && gameStarted && chess.turn() === playerRole) {
                        const targetSquare = { row: rowindex, col: squareindex };
                        const boardSquare = chess.board()[rowindex][squareindex];
                        
                        if (boardSquare && boardSquare.color !== playerRole) {
                            handleMove(selectedSquare, targetSquare);
                            selectedSquare = null;
                            clearHighlights();
                            return;
                        }
                    }
                    
                    if (playerRole === square.color && chess.turn() === square.color && gameStarted) {
                        if (selectedSquare && selectedSquare.row === rowindex && selectedSquare.col === squareindex) {
                            clearHighlights();
                            selectedSquare = null;
                        } else {
                            clearHighlights();
                            selectedSquare = { row: rowindex, col: squareindex };
                            highlightPossibleMoves(rowindex, squareindex);
                            squareElement.classList.add('selected');
                        }
                    }
                });
                
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable && chess.turn() === square.color && gameStarted) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", "");
                        setTimeout(() => { pieceElement.style.opacity = "0.4"; }, 0);
                        clearHighlights();
                        highlightPossibleMoves(rowindex, squareindex);
                    }
                });
                
                pieceElement.addEventListener("dragend", (e) => {
                    pieceElement.style.opacity = "1";
                    draggedPiece = null;
                    sourceSquare = null;
                });
                
                squareElement.appendChild(pieceElement);
            }
            
            squareElement.addEventListener('click', (e) => {
                if (selectedSquare && gameStarted && !e.target.classList.contains('piece')) {
                    const targetSquare = { row: parseInt(squareElement.dataset.row), col: parseInt(squareElement.dataset.col) };
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
                if (draggedPiece && gameStarted) {
                    const targetSquare = { row: parseInt(squareElement.dataset.row), col: parseInt(squareElement.dataset.col) };
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
    
    highlightLastMove();
};

const highlightLastMove = () => {
    if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        const fromSquare = document.querySelector(`[data-row="${lastMove.fromRow}"][data-col="${lastMove.fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${lastMove.toRow}"][data-col="${lastMove.toCol}"]`);
        if (fromSquare) fromSquare.classList.add('last-move');
        if (toSquare) toSquare.classList.add('last-move');
    }
};

const updateTurnIndicator = () => {
    if (!turnIndicator) return;
    
    const currentTurn = chess.turn();
    const turnText = currentTurn === 'w' ? 'White' : 'Black';
    
    if (!gameStarted) {
        turnIndicator.innerHTML = '<strong>Waiting for game to start...</strong>';
        turnIndicator.className = 'turn-indicator waiting';
        return;
    }
    
    if (chess.game_over()) {
        if (chess.in_checkmate()) {
            const winner = currentTurn === 'w' ? 'Black' : 'White';
            turnIndicator.innerHTML = `<strong>CHECKMATE!</strong> ${winner} Wins! 👑`;
            turnIndicator.className = 'turn-indicator gameover';
        } else if (chess.in_stalemate()) {
            turnIndicator.innerHTML = '<strong>STALEMATE!</strong> Draw 🤝';
            turnIndicator.className = 'turn-indicator draw';
        } else if (chess.in_threefold_repetition()) {
            turnIndicator.innerHTML = '<strong>DRAW!</strong> Threefold Repetition 🤝';
            turnIndicator.className = 'turn-indicator draw';
        } else if (chess.insufficient_material()) {
            turnIndicator.innerHTML = '<strong>DRAW!</strong> Insufficient Material 🤝';
            turnIndicator.className = 'turn-indicator draw';
        } else if (chess.in_draw()) {
            turnIndicator.innerHTML = '<strong>DRAW!</strong> 50-Move Rule 🤝';
            turnIndicator.className = 'turn-indicator draw';
        }
        return;
    }
    
    turnIndicator.innerHTML = `<strong>Current Turn:</strong> ${turnText}`;
    turnIndicator.className = 'turn-indicator ' + (currentTurn === 'w' ? 'white-turn' : 'black-turn');
    
    if (playerRole === currentTurn) {
        turnIndicator.innerHTML += ' <span class="your-turn">●</span>';
    }
    
    if (chess.in_check()) {
        turnIndicator.innerHTML += ' <span class="check-indicator">CHECK!</span>';
    }
};

const showStatus = (message, type = 'info') => {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
};

const hideStatus = () => {
    if (statusMessage) {
        statusMessage.style.display = 'none';
    }
};

const highlightPossibleMoves = (row, col) => {
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const moves = chess.moves({ square: square, verbose: true });
    
    moves.forEach(move => {
        const targetCol = move.to.charCodeAt(0) - 97;
        const targetRow = 8 - parseInt(move.to[1]);
        const targetSquare = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
        
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
    document.querySelectorAll('.possible-move, .capture-highlight, .selected, .last-move').forEach(el => {
        el.classList.remove('possible-move', 'capture-highlight', 'selected', 'last-move');
    });
};

const handleMove = (source, target) => {
    if (!gameStarted) {
        return;
    }
    
    const from = `${String.fromCharCode(97 + source.col)}${8 - source.row}`;
    const to = `${String.fromCharCode(97 + target.col)}${8 - target.row}`;
    const move = { from: from, to: to, promotion: "q" };
    
    const targetSquareElement = document.querySelector(`[data-row="${target.row}"][data-col="${target.col}"]`);
    const capturedPiece = targetSquareElement ? targetSquareElement.querySelector('.piece') : null;
    
    if (capturedPiece) {
        capturedPiece.style.animation = 'captureExplode 0.5s ease-out forwards';
        playCaptureSound();
        setTimeout(() => {
            socket.emit('move', move);
            moveHistory.push({ fromRow: source.row, fromCol: source.col, toRow: target.row, toCol: target.col });
            clearHighlights();
        }, 100);
    } else {
        playMoveSound();
        socket.emit('move', move);
        moveHistory.push({ fromRow: source.row, fromCol: source.col, toRow: target.row, toCol: target.col });
        clearHighlights();
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
        P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role;
    const roleText = role === 'w' ? 'White' : 'Black';
    showStatus(`You are ${roleText}`, 'success');
    setTimeout(() => hideStatus(), 2000);
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    showStatus("Spectating", 'info');
    renderBoard();
});

socket.on("waitingForOpponent", (message) => {
    showStatus(message, 'waiting');
    gameStarted = false;
    renderBoard();
});

socket.on("spectatorMessage", (message) => {
    showStatus(message, 'info');
});

socket.on("gameStarted", () => {
    gameStarted = true;
    hideStatus();
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    const result = chess.move(move);
    if (result) {
        const fromCol = move.from.charCodeAt(0) - 97;
        const fromRow = 8 - parseInt(move.from[1]);
        const toCol = move.to.charCodeAt(0) - 97;
        const toRow = 8 - parseInt(move.to[1]);
        moveHistory.push({ fromRow: fromRow, fromCol: fromCol, toRow: toRow, toCol: toCol });
        
        if (result.captured) {
            playCaptureSound();
        } else {
            playMoveSound();
        }
    }
    renderBoard();
});

socket.on("invalidMove", (message) => {
    renderBoard();
});

socket.on("opponentDisconnected", (data) => {
    gameStarted = false;
    showStatus("Opponent disconnected! Waiting 20 seconds...", 'warning');
    renderBoard();
});

socket.on("opponentReconnected", (message) => {
    gameStarted = true;
    showStatus("Opponent reconnected! Game continues...", 'success');
    setTimeout(() => hideStatus(), 2000);
    renderBoard();
});

socket.on("gameResumed", (message) => {
    gameStarted = true;
    showStatus(message, 'success');
    setTimeout(() => hideStatus(), 2000);
    renderBoard();
});

socket.on("playerLeft", (data) => {
    gameStarted = false;
    showStatus("Opponent didn't reconnect. Starting new game...", 'error');
    setTimeout(() => {
        hideStatus();
    }, 3000);
    renderBoard();
});

socket.on("gameOver", (result) => {
    gameStarted = false;
    showStatus(result, 'gameover');
    setTimeout(() => {
        showStatus("Starting new game in 3 seconds...", 'info');
    }, 2000);
});

socket.on("gameReset", () => {
    chess.reset();
    gameStarted = false;
    selectedSquare = null;
    moveHistory = [];
    clearHighlights();
    hideStatus();
    renderBoard();
});

socket.on("playersInfo", (data) => {
    console.log("Players:", data);
});

renderBoard();
