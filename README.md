# 🧮 NeoCalc - Premium Glassmorphism React Calculator

Welcome to **NeoCalc**! This project is a fully-featured, gorgeous, modern scientific calculator built with **React 19** and compiled via **Vite**. It features a stunning, state-of-the-art **Glassmorphism & Neon HSL UI** with ambient background glows, micro-animations, and responsive layouts.

It is fully containerized with a production-grade multi-stage Docker build and Nginx static server.

---

## 📂 Repository Info
- **GitHub User**: [achrafthedev](https://github.com/achrafthedev)  
- **Repository Name**: [neocalc](https://github.com/achrafthedev/neocalc)

---

## ✨ Features

- 🌗 **Premium Dark/Light Themes**: Soft theme transitioning with ambient glows using HSL tailored color palettes.
- 🧪 **Standard & Scientific Modes**: Swappable grid layouts. Scientific mode includes:
  - Trigonometry: `sin`, `cos`, `tan`
  - Logarithms: `log` (base 10), `ln` (natural log)
  - Exponents & Powers: `^`, `x²`, `1/x`
  - Grouping: Parentheses `( )`
  - Constants: `π` (Math.PI) and `e` (Math.E)
- 🔒 **Safe Expression Parser**: Custom parser using the **Shunting-Yard Algorithm** for safe evaluation. Completely eliminates JavaScript `eval()`.
- ⚡ **Live Preview Display**: Shows calculation results instantly in a soft text preview as you type, with smart automatic bracket closure.
- ⌨️ **Comprehensive Keyboard Listeners**: Listeners capture key presses globally so you can type calculations naturally (`0-9`, `.`, `+`, `-`, `*`, `/`, `^`, `%`, `(`, `)`, `Enter` / `=`, `Backspace`, `Escape`).
- 🕰️ **Calculations History Drawer**: A slide-in panel logging past calculations with click-to-load and clipboard copying capability.
- 🔊 **Web Audio Sound Effects**: A custom synthesiser generates pleasant, snappy digital sound effects on button clicks (can be muted via a header button).

---

## 🚀 Getting Started

### 1️⃣ Run Locally with Node.js

#### Clone the Repository
```bash
git clone https://github.com/achrafthedev/neocalc.git
cd neocalc
```

#### Install Dependencies
```bash
npm install
```

#### Run in Development Mode
```bash
npm run dev
```
The app will run locally and open at **http://localhost:3000** in your browser.

#### Build for Production
```bash
npm run build
```
This builds static assets into the `/dist` directory.

---

### 2️⃣ Run with Docker (Recommended)

Make sure you have Docker and Docker Compose installed.

#### Run with Docker Compose
To build and run the application inside an optimized Nginx container:
```bash
docker-compose up --build -d
```
The application will instantly compile and be served at **http://localhost:3000**.

#### Stop the Container
```bash
docker-compose down
```

---

## 🛠️ Architecture and Stack

- **React 19** & **Vite**: Modern UI runtime and lightning-fast developer tooling.
- **Vanilla CSS3**: Tailored HSL color models, custom CSS variables, custom grids, and glassmorphic blurred filters (`backdrop-filter: blur(20px)`). No massive design frameworks needed!
- **Nginx**: Serves built static files, handles security headers, enables Gzip compression, and optimizes browser caching for production.
- **Docker**: Simple container orchestration to build and deploy anywhere.

---

## ⌨️ Keyboard Shortcut Maps

| Keyboard Key | Calculator Button | Action |
| :--- | :--- | :--- |
| `0` - `9` | `0` - `9` | Input Numbers |
| `.` | `.` | Decimal separator |
| `+` | `+` | Addition |
| `-` | `-` | Subtraction |
| `*` | `×` | Multiplication |
| `/` | `÷` | Division |
| `%` | `%` | Modulo |
| `^` | `^` | Exponent power |
| `(` / `)` | `(` / `)` | Brackets |
| `Enter` / `=` | `=` | Calculate |
| `Backspace` | `CE` | Delete last entry |
| `Escape` | `C` | Clear screen |

---

## 🤝 Contributing
Contributions are welcome! Feel free to fork the repository and submit a pull request.

---

## 🖊️ License
This project is licensed under the **MIT License**.
