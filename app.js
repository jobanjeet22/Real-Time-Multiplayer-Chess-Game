
const express = require('express');
const app = express();
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game' });
});

io.on("connection", function(uniquesocket) {
    console.log('New connection:', uniquesocket.id);
    
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
        console.log('White player connected:', uniquesocket.id);
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b');
        console.log('Black player connected:', uniquesocket.id);
    } else {
        uniquesocket.emit("spectatorRole");
        console.log('Spectator connected:', uniquesocket.id);
    }
    
    uniquesocket.emit("boardState", chess.fen());
    
    uniquesocket.on("disconnect", () => {
        console.log('Player disconnected:', uniquesocket.id);
        
        if (uniquesocket.id === players.white) {
            delete players.white;
            console.log('White player disconnected');
        } else if (uniquesocket.id === players.black) {
            delete players.black;
            console.log('Black player disconnected');
        }
    });
    
    uniquesocket.on("move", (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) {
                console.log('Not white player\'s turn');
                return;
            }
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) {
                console.log('Not black player\'s turn');
                return;
            }
            
            const result = chess.move(move);
            
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
                
                console.log('Move executed:', move);
                
                if (chess.isGameOver()) {
                    if (chess.isCheckmate()) {
                        const winner = chess.turn() === 'w' ? 'Black' : 'White';
                        io.emit("gameOver", `Checkmate! ${winner} wins!`);
                        console.log(`Game Over: ${winner} wins by checkmate`);
                    } else if (chess.isDraw()) {
                        io.emit("gameOver", "Game drawn!");
                        console.log('Game Over: Draw');
                    } else if (chess.isStalemate()) {
                        io.emit("gameOver", "Stalemate!");
                        console.log('Game Over: Stalemate');
                    } else if (chess.isThreefoldRepetition()) {
                        io.emit("gameOver", "Draw by threefold repetition!");
                        console.log('Game Over: Threefold repetition');
                    } else if (chess.isInsufficientMaterial()) {
                        io.emit("gameOver", "Draw by insufficient material!");
                        console.log('Game Over: Insufficient material');
                    }
                }
            } else {
                console.log('Invalid move attempted:', move);
                uniquesocket.emit("invalidMove", move);
            }
            
        } catch (error) {
            console.log('Error processing move:', error);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, () => {
    console.log('Chess server listening on http://localhost:3000');
});