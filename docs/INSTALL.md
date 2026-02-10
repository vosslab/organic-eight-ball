# Install

Install means you have a local copy of this repo and can open the game in a browser.

## Requirements

- A modern web browser (Chrome, Firefox, Safari, or Edge).
- Optional but recommended: Python 3 to run a local web server.
- Optional: Git, if you want to clone instead of downloading a ZIP.

## Get the project

### Option A: no Git (easiest)

1. Open [https://github.com/vosslab/organic-eight-ball](https://github.com/vosslab/organic-eight-ball).
2. Click `Code`, then `Download ZIP`.
3. Unzip the folder.
4. Open a terminal in the unzipped folder.

### Option B: with Git

```bash
git clone https://github.com/vosslab/organic-eight-ball.git
cd organic-eight-ball
```

## Start the game

### Recommended: local server

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 -m http.server 8000
```

Then open [http://localhost:8000/index.html](http://localhost:8000/index.html).

### Alternate: direct file open

- Open `index.html` directly in your browser (`file://...`).
- This mode is supported, but uses a reduced fallback group set.

## Verify install

Run this in the repo root:

```bash
/opt/homebrew/opt/python@3.12/bin/python3.12 -m http.server 8000
```

Install is verified when the command starts without errors and serves files at
[http://localhost:8000/index.html](http://localhost:8000/index.html).

## Troubleshooting

- If the page opens but group data fails to load, run the local server command above.
- If you opened with `file://`, the game may show an in-app warning about fallback groups.

## Known gaps

- TODO: Add Windows-specific and Linux-specific examples if this repo needs them.
- TODO: Add browser version support matrix if formal support targets are defined.
