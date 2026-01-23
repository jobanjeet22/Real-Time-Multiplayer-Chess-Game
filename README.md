# ♟️ Real-Time Multiplayer Chess Game

A full-stack real-time multiplayer chess game built with Node.js, Express, Socket.IO, and Chess.js. Play chess with friends online with live move synchronization, visual move hints, and an intuitive drag-and-drop interface.

![Chess Game](https://img.shields.io/badge/Chess-Multiplayer-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-orange)

## ✨ Features

- 🎮 **Real-Time Multiplayer** - Play with friends using WebSocket technology
- 🎯 **Move Validation** - Chess.js ensures all moves follow official chess rules
- 💡 **Visual Move Hints** - Green dots show possible moves, red circles show captures
- 🖱️ **Dual Input Methods** - Click-to-move or drag-and-drop pieces
- 👁️ **Spectator Mode** - Watch games in progress without interfering
- 🔄 **Turn Indicator** - Clear display of whose turn it is
- ♔ **Check Detection** - Visual and text alerts when king is in check
- 🏁 **Game Over Detection** - Detects checkmate, stalemate, and draws
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔄 **Auto Board Flip** - Board automatically flips for black player

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **Chess.js** - Chess move validation and game logic

### Frontend
- **Vanilla JavaScript** - Client-side logic
- **EJS** - Templating engine
- **Tailwind CSS** - Utility-first styling
- **Chess.js** - Client-side game state management

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chess-multiplayer-game.git
   cd chess-multiplayer-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   node app.js
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📂 Project Structure

```
chess-multiplayer-game/
├── views/
│   └── index.ejs              # Main game template
├── public/
│   └── js/
│       └── chessGame.js       # Client-side game logic
├── app.js                     # Server and Socket.IO setup
├── package.json               # Dependencies
└── README.md                  # Documentation
```

## 🎮 How to Play

1. **Open the game** in your browser at `http://localhost:3000`
2. **First player** automatically becomes White
3. **Second player** automatically becomes Black
4. **Additional viewers** join as spectators
5. **Make moves** by:
   - Clicking a piece, then clicking the destination square, OR
   - Dragging a piece to the destination square
6. **Visual hints** show possible moves when you select/drag a piece
7. **Turn indicator** at the top shows whose turn it is

## 🔧 Configuration

### Change Port
Edit `app.js`:
```javascript
server.listen(3000, () => {
    console.log('Chess server listening on http://localhost:3000');
});
```

### Customize Board Size
Edit `views/index.ejs`:
```css
.chessboard {
    width: 400px;  /* Change this */
    height: 400px; /* And this */
}
```

## 🌐 Deployment

### Deploy to Heroku

1. **Create a Heroku app**
   ```bash
   heroku create your-chess-game
   ```

2. **Push to Heroku**
   ```bash
   git push heroku main
   ```

3. **Open the app**
   ```bash
   heroku open
   ```

### Deploy to Render/Railway

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `node app.js`
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues

- Players cannot reconnect to an ongoing game after disconnection
- No user authentication or game history
- No timer/clock for moves

## 🚀 Future Enhancements

- [ ] Player authentication and profiles
- [ ] Game history and replay
- [ ] Move timer/chess clock
- [ ] Chat functionality
- [ ] Elo rating system
- [ ] Save and resume games
- [ ] Multiple game rooms
- [ ] Move history display
- [ ] Sound effects
- [ ] Themes and customization

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- [Chess.js](https://github.com/jhlywa/chess.js) - Chess move validation library
- [Socket.IO](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📸 Screenshots

### Game Board
![Game Board](screenshots/game-board.png)

### Move Hints
![Move Hints](screenshots/move-hints.png)

### Turn Indicator
![Turn Indicator](screenshots/turn-indicator.png)

---

⭐ **Star this repo** if you found it helpful!

🐛 **Found a bug?** Open an issue!

💡 **Have an idea?** Submit a pull request!
