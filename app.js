const express = require('express');
const app = express();
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const server = http.createServer(app);
const io = socket(server);

let gameState = {
    chess: new Chess(),
    players: { white: null, black: null },
    playerNames: { white: null, black: null },
    disconnectedPlayers: { white: null, black: null },
    spectators: [],
    gameStarted: false,
    lastActivity: Date.now()
};

let disconnectTimer = null;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Realtime Chess Game' });
});

const resetGame = () => {
    gameState.chess = new Chess();
    gameState.players.white = null;
    gameState.players.black = null;
    gameState.playerNames.white = null;
    gameState.playerNames.black = null;
    gameState.disconnectedPlayers.white = null;
    gameState.disconnectedPlayers.black = null;
    gameState.spectators = [];
    gameState.gameStarted = false;
    gameState.lastActivity = Date.now();
    
    if (disconnectTimer) {
        clearTimeout(disconnectTimer);
        disconnectTimer = null;
    }
    
    console.log('Game reset');
    io.emit("gameReset");
};

const checkGameStart = () => {
    if (gameState.players.white && gameState.players.black && !gameState.gameStarted) {
        gameState.gameStarted = true;
        io.emit("gameStarted");
        io.emit("boardState", gameState.chess.fen());
        console.log('Game started!');
    }
};

const handleDisconnection = (socketId) => {
    const isWhite = gameState.players.white === socketId;
    const isBlack = gameState.players.black === socketId;
    
    if (isWhite || isBlack) {
        const color = isWhite ? 'white' : 'black';
        const opponentColor = isWhite ? 'black' : 'white';
        const opponentId = gameState.players[opponentColor];
        
        gameState.disconnectedPlayers[color] = socketId;
        
        if (opponentId) {
            io.to(opponentId).emit("opponentDisconnected", {
                message: "Opponent disconnected. Waiting for reconnection...",
                color: color
            });
        }
        
        if (disconnectTimer) clearTimeout(disconnectTimer);
        
        disconnectTimer = setTimeout(() => {
            console.log(`Player ${color} did not reconnect. Resetting game.`);
            io.emit("playerLeft", {
                message: "Opponent left the game. Game will reset.",
                color: color
            });
            setTimeout(() => { resetGame(); }, 2000);
        }, 20000);
        
        gameState.players[color] = null;
        gameState.gameStarted = false;
    }
};

const checkGameOver = () => {
    if (gameState.chess.game_over()) {
        let message = "";
        
        if (gameState.chess.in_checkmate()) {
            const winner = gameState.chess.turn() === 'w' ? 'Black' : 'White';
            message = `Checkmate! ${winner} wins! 👑`;
        } else if (gameState.chess.in_stalemate()) {
            message = "Stalemate! Game drawn! 🤝";
        } else if (gameState.chess.in_threefold_repetition()) {
            message = "Draw by threefold repetition! 🤝";
        } else if (gameState.chess.insufficient_material()) {
            message = "Draw by insufficient material! 🤝";
        } else if (gameState.chess.in_draw()) {
            message = "Draw by 50-move rule! 🤝";
        }
        
        io.emit("gameOver", message);
        console.log('Game Over:', message);
        setTimeout(() => { resetGame(); }, 5000);
        return true;
    }
    return false;
};

io.on("connection", function(uniquesocket) {
    console.log('New connection:', uniquesocket.id);
    
    let reconnected = false;
    
    uniquesocket.on('reconnectPlayer', (data) => {
        const { role, oldSocketId } = data;
        
        if (role === 'w' && (!gameState.players.white || gameState.disconnectedPlayers.white === oldSocketId)) {
            gameState.players.white = uniquesocket.id;
            gameState.disconnectedPlayers.white = null;
            uniquesocket.emit("playerRole", "w");
            uniquesocket.emit("boardState", gameState.chess.fen());
            uniquesocket.emit("gameResumed", "Reconnected as White!");
            reconnected = true;
            
            if (disconnectTimer) {
                clearTimeout(disconnectTimer);
                disconnectTimer = null;
            }
            
            if (gameState.players.black) {
                gameState.gameStarted = true;
                io.emit("gameStarted");
            }
        } else if (role === 'b' && (!gameState.players.black || gameState.disconnectedPlayers.black === oldSocketId)) {
            gameState.players.black = uniquesocket.id;
            gameState.disconnectedPlayers.black = null;
            uniquesocket.emit("playerRole", "b");
            uniquesocket.emit("boardState", gameState.chess.fen());
            uniquesocket.emit("gameResumed", "Reconnected as Black!");
            reconnected = true;
            
            if (disconnectTimer) {
                clearTimeout(disconnectTimer);
                disconnectTimer = null;
            }
            
            if (gameState.players.white) {
                gameState.gameStarted = true;
                io.emit("gameStarted");
            }
        }
    });
    
    if (gameState.disconnectedPlayers.white === uniquesocket.id) {
        gameState.players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
        uniquesocket.emit("boardState", gameState.chess.fen());
        uniquesocket.emit("gameResumed", "You reconnected! Game continues...");
        console.log('White player reconnected:', uniquesocket.id);
        reconnected = true;
        
        if (disconnectTimer) {
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
        }
        
        gameState.disconnectedPlayers.white = null;
        
        if (gameState.players.black) {
            gameState.gameStarted = true;
            io.to(gameState.players.black).emit("opponentReconnected", "Opponent reconnected! Game continues...");
            io.emit("gameStarted");
        }
    } else if (gameState.disconnectedPlayers.black === uniquesocket.id) {
        gameState.players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
        uniquesocket.emit("boardState", gameState.chess.fen());
        uniquesocket.emit("gameResumed", "You reconnected! Game continues...");
        console.log('Black player reconnected:', uniquesocket.id);
        reconnected = true;
        
        if (disconnectTimer) {
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
        }
        
        gameState.disconnectedPlayers.black = null;
        
        if (gameState.players.white) {
            gameState.gameStarted = true;
            io.to(gameState.players.white).emit("opponentReconnected", "Opponent reconnected! Game continues...");
            io.emit("gameStarted");
        }
    }
    
    setTimeout(() => {
        if (!reconnected) {
            if (!gameState.players.white) {
                gameState.players.white = uniquesocket.id;
                gameState.playerNames.white = `Player ${uniquesocket.id.substring(0, 5)}`;
                uniquesocket.emit("playerRole", "w");
                uniquesocket.emit("waitingForOpponent", "Waiting for opponent to join...");
                console.log('White player connected:', uniquesocket.id);
                
                if (disconnectTimer) {
                    clearTimeout(disconnectTimer);
                    disconnectTimer = null;
                }
            } else if (!gameState.players.black) {
                gameState.players.black = uniquesocket.id;
                gameState.playerNames.black = `Player ${uniquesocket.id.substring(0, 5)}`;
                uniquesocket.emit("playerRole", "b");
                console.log('Black player connected:', uniquesocket.id);
                
                if (disconnectTimer) {
                    clearTimeout(disconnectTimer);
                    disconnectTimer = null;
                }
                
                checkGameStart();
            } else {
                gameState.spectators.push(uniquesocket.id);
                uniquesocket.emit("spectatorRole");
                uniquesocket.emit("spectatorMessage", "You are watching this game as a spectator.");
                console.log('Spectator connected:', uniquesocket.id);
            }
        }
    }, 100);
    
    uniquesocket.emit("boardState", gameState.chess.fen());
    
    io.emit("playersInfo", {
        white: gameState.playerNames.white,
        black: gameState.playerNames.black,
        gameStarted: gameState.gameStarted
    });
    
    uniquesocket.on("disconnect", () => {
        console.log('Player disconnected:', uniquesocket.id);
        gameState.spectators = gameState.spectators.filter(id => id !== uniquesocket.id);
        handleDisconnection(uniquesocket.id);
    });
    
    uniquesocket.on("move", (move) => {
        try {
            if (!gameState.gameStarted) {
                return;
            }
            
            if (gameState.chess.turn() === 'w' && uniquesocket.id !== gameState.players.white) {
                return;
            }
            if (gameState.chess.turn() === 'b' && uniquesocket.id !== gameState.players.black) {
                return;
            }
            
            const result = gameState.chess.move(move);
            
            if (result) {
                gameState.lastActivity = Date.now();
                io.emit("move", move);
                io.emit("boardState", gameState.chess.fen());
                console.log('Move executed:', move);
                checkGameOver();
            }
            
        } catch (error) {
            console.log('Error processing move:', error);
        }
    });
    
    uniquesocket.on("requestRematch", () => {
        resetGame();
    });
});

setInterval(() => {
    const inactiveTime = Date.now() - gameState.lastActivity;
    if (inactiveTime > 30 * 60 * 1000 && gameState.gameStarted) {
        console.log('Game inactive for 30 minutes, resetting...');
        resetGame();
    }
}, 60000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Chess server listening on port ${PORT}`);
});
