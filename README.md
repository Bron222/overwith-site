# overwith-site

The website for the Overwith app, live at [overwith.app](https://overwith.app).
It's plain HTML, CSS and a little JavaScript, hosted on GitHub Pages, with no
build step.

## Pages

| File | Address | What it is |
| --- | --- | --- |
| `index.html` | `/` | Home page: a quick, playful overview with things to try |
| `support.html` | `/support` | Help questions with a search box (the store support link) |
| `privacy.html` | `/privacy` | Privacy policy (the store privacy link) |
| `404.html` | any broken link | "This page didn't get done." |

## Other files

- `style.css`: all styles. Colours are set once at the top, with a dark mode version.
- `script.js`: the home page demos, sounds and the support search. Every page
  still works without it.
- `fonts/`: Bricolage Grotesque, Figtree and Caveat, with their open font
  licences. They're hosted here so the site never sends visitors to Google or
  anyone else.
- `favicon.svg`: the tab icon (temporary, until the app icon is ready).
- `CNAME` and `.nojekyll`: GitHub Pages settings.

## Privacy

The site has no analytics, no cookies and no third-party requests. The only
thing it remembers is your sound on/off choice, saved in your own browser.

## Preview locally

Links use addresses like `/privacy`, so open the site through a local server
rather than double-clicking the files:

```powershell
python -m http.server 8000
```

Then go to http://localhost:8000. Locally, open `/privacy.html` and
`/support.html` with the `.html` ending. GitHub Pages handles the short
addresses.
