# 🐍 Saurabh Suman's Snake Game

A modern, neon-themed Snake Game built with **HTML, CSS, and JavaScript**.

The game features multiple difficulty levels, responsive design, animated visuals, sound effects, particle effects, score tracking, and persistent high scores.

---

## 🎮 Features

* 🐍 Classic Snake gameplay
* 🎯 Score system — **10 points per fruit**
* 🏆 Persistent **High Score**
* 🟢 Easy difficulty
* 🟡 Medium difficulty
* 🔴 Hard difficulty
* ⌨️ Arrow Key controls
* ⌨️ WASD controls
* ⏸️ Pause / Resume
* 🚪 Exit Game
* 🔊 Sound effects
* 🍎 Animated food with glow effects
* ✨ Particle effects when eating food
* 💥 Game Over sound effect
* 👀 Animated snake eyes and tongue
* 🌈 Neon/glowing visual design
* 📱 Responsive layout for smaller screens
* 💾 High score saved using browser Local Storage

---

## 🎮 Controls

| Action         | Keyboard   |
| -------------- | ---------- |
| Move Up        | `↑` or `W` |
| Move Down      | `↓` or `S` |
| Move Left      | `←` or `A` |
| Move Right     | `→` or `D` |
| Pause / Resume | `SPACE`    |
| Exit Game      | `ESC`      |
| Start Game     | `ENTER`    |

---

## ⚡ Difficulty Levels

| Level     | Difficulty        | Speed  |
| --------- | ----------------- | ------ |
| 🟢 Easy   | Beginner friendly | Slow   |
| 🟡 Medium | Moderate          | Medium |
| 🔴 Hard   | Challenging       | Fast   |

The difficulty can be selected before starting the game.

---

## 🏆 Scoring

Every time the snake eats a fruit:

**🍎 1 Fruit = 10 Points**

The snake also grows after eating each fruit.

The highest score is automatically stored in the browser using **Local Storage**, so the high score remains available even after refreshing the page.

---

## 🔊 Sound System

The game uses the **Web Audio API** for game sound effects.

Sound effects include:

* 🍎 Food eating sound
* 💥 Game Over sound
* 🔊 Sound On / Off control

A custom `gameover.mp3` file can also be used for the Game Over sound.

If the custom audio file is unavailable, the game automatically falls back to a built-in Web Audio effect.

---

## 📂 Project Structure

```text
snake-game/
│
├── index.html
├── style.css
├── script.js
├── gameover.mp3
└── README.md
```

---

## 🛠️ Technologies Used

* **HTML5** — Game structure
* **CSS3** — Styling, animations and responsive design
* **JavaScript** — Game logic and interactions
* **HTML Canvas API** — Snake and game rendering
* **Web Audio API** — Sound effects
* **Local Storage API** — High score persistence
* **Google Fonts** — Orbitron & Poppins

---

## 🚀 How to Run

### Option 1 — Run locally

1. Clone the repository:

```bash
git clone https://github.com/100rabh-100uman/snake-game.git
```

2. Open the project folder.

3. Open `index.html` in your browser.

### Option 2 — Use VS Code

Open the project folder in **Visual Studio Code** and launch `index.html` using a local development server such as **Live Server**.

---

## 🎯 Game Rules

* Eat the 🍎 fruit to increase your score.
* Every fruit gives **10 points**.
* The snake grows after eating a fruit.
* Avoid colliding with your own body.
* The game wraps around the screen when crossing the boundary.
* The game ends when the snake collides with itself.

---

## 🎨 Design

The game uses a futuristic neon interface featuring:

* Glassmorphism panels
* Neon gradients
* Glowing borders
* Animated background effects
* Responsive layout
* Canvas-based game rendering
* Animated snake and food

---

## 📸 Screenshots

Screenshots can be added here in the future.

```text
Add screenshots of the game here.
```

---

## 🔮 Future Improvements

Possible future features include:

* 🎵 Background music
* 📱 Touch / swipe controls
* 🏅 Online leaderboard
* 👤 Player profiles
* 🎨 Multiple themes
* 🍒 Different types of food
* 🧱 Obstacles and walls
* 🎮 Special power-ups
* 📊 Detailed game statistics
* 🌐 Online multiplayer

---

## 👨‍💻 Author

**Saurabh Suman**

Built as a personal JavaScript game project to practice frontend development, game logic, animations, and browser APIs.

---

## 📄 License

No license has been added to this repository yet.
