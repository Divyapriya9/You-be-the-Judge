# You Be the Judge
Hear a case, rule on it, defend your reasoning, and watch the consequences branch out.
Free, open, no build step, no accounts.

## Run locally
    python3 -m http.server 8000
Open http://localhost:8000 (double-clicking index.html will not work, because the case is loaded with fetch).

## Deploy free on GitHub Pages
1. Create a public repo and upload these files (or `git push`).
2. Settings > Pages > Deploy from a branch > `main` / `(root)` > Save.
3. Your site appears at https://YOURNAME.github.io/REPO/ within a minute or two.

## Add a case
Copy `data/case-001.json`, change the content, and point `fetch(...)` in `js/main.js` at it.
