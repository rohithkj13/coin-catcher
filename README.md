# 🪙 Coin Catcher

A lightweight, responsive arcade game built with pure HTML5 Canvas and vanilla JavaScript. Catch coins and gems, dodge bombs, and build combos to reach the highest score!

Playable across desktop, Android, and iOS browsers with zero external runtime dependencies.

---

## 🎮 Features
- **Zero Dependencies**: Pure HTML5 Canvas, Vanilla CSS, and modern JavaScript.
- **Synthesized Audio**: Web Audio API generates retro sound effects dynamically (no external audio files needed).
- **Responsive & Mobile Ready**: Automatic touch drag, touch-action support, and mobile notch safe-area handling.
- **PWA Ready**: Web App Manifest (`manifest.json`) and vector favicon (`favicon.svg`) for installability on home screens.
- **Retina / HiDPI Crisp**: Dynamic `devicePixelRatio` scaling ensures razor-sharp visuals on 4K and mobile Retina displays.
- **Persistent High Scores**: Automatically saves your best score via `localStorage`.

---

## 🕹️ Controls
| Platform | Action | Controls |
| :--- | :--- | :--- |
| **Desktop** | Move | <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> / <kbd>D</kbd> or Mouse |
| **Desktop** | Start / Restart | <kbd>Enter</kbd> / <kbd>Space</kbd> / <kbd>↑</kbd> |
| **Mobile / Tablet** | Move | Touch & drag across screen |
| **Any** | Sound | Toggle mute button (🔊 / 🔇) |

---

## 🏆 Scoring & Rules
- **🪙 Coin**: `+1 point`
- **💎 Gem**: `+5 points`
- **💣 Bomb**: `-1 life` and combo resets
- **Combo Multiplier**: Catching 5 items consecutively increases the multiplier (`x2`, `x3`, etc.).
- **Missing Coins**: Missing a falling coin costs 1 life. (You start with 3 lives).
- **Level Speed**: The falling speed increases every 100 points.

---

## 🧪 Testing
Run the logic unit tests with Node.js:
```bash
npm test
# or
node test.js
```
Runs 19 logic tests covering movement, collisions, boundary clamping, scoring, and combos.

---

## 🚀 Local Development
Serve locally using Python or Node:
```bash
# Using Node:
npm start

# Or using Python:
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🌐 Public Deployment

### Option 1: GitHub Pages (Recommended)
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Coin Catcher"
   ```
2. Create a repository on [GitHub](https://github.com/new) named `coin-catcher`.
3. Link and push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/coin-catcher.git
   git branch -M main
   git push -u origin main
   ```
4. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, choose **GitHub Actions** (the workflow at `.github/workflows/deploy.yml` will automatically deploy your game).
   - Your public game will be live at: `https://<your-username>.github.io/coin-catcher/`

### Option 2: Netlify (Drag & Drop or Git)
- **Drag & Drop**: Head to [Netlify Drop](https://app.netlify.com/drop) and drag the project folder into your browser for an instant public URL.
- **Git**: Connect your GitHub repository with publish directory set to `.`.

### Option 3: Vercel
- Import the GitHub repository into [Vercel](https://vercel.com) or run `npx vercel` in the project folder.
