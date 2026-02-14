# SeCured

A simple static website to compare secured (FD-backed) credit cards in India.
It also supports co-branded cards so you can compare secured vs co-branded options.

## Local run

Because the app loads JSON with `fetch`, run it with a local HTTP server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Project structure

- `index.html` - page structure
- `assets/styles.css` - UI design and responsive layout
- `assets/app.js` - filter + compare logic
- `data/cards.json` - card dataset

Click any card tile to open a details popup, then close it and continue browsing.

## Update card data

Edit `data/cards.json`.

Each card object uses:

- `id` (string, unique)
- `name`
- `issuer`
- `cardCategory` (`secured` | `co-branded`)
- `partner` (e.g. `Visa`, `Tata Neu`, `Amazon Pay`)
- `joiningFee` (number, INR)
- `annualFee` (number, INR)
- `minFd` (number, INR)
- `limitPolicy` (string)
- `rewardType` (`cashback` | `points` | `mixed`)
- `rewards` (string)
- `forexMarkup` (string)
- `loungeAccess` (string)
- `eligibility` (string)
- `image` (string path to image/SVG)
- `officialImage` (optional external issuer-provided image URL)
- `issuerDomain` (domain used by logo.dev, e.g. `hdfcbank.com`)
- `imageAlt` (string)
- `applyUrl` (string URL; can be affiliate link later)
- `notes` (string)

Update `lastUpdated` whenever you refresh data.

## Affiliate disclosure support

Card tiles and the comparison table include an `Apply now` link from `applyUrl`.
If you later use affiliate links, replace `applyUrl` with your tracked URL.

## Logo provider (logo.dev)

Issuer logos are rendered using:

```text
https://img.logo.dev/<issuerDomain>?size=64&format=png&fallback=monogram
```

Optional: add top-level `logoDevToken` in `data/cards.json` if you have a token:

```json
{
  "logoDevToken": "YOUR_PUBLISHABLE_TOKEN"
}
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open repository `Settings` -> `Pages`.
3. Under **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save and wait for deployment.

The site URL will be:

- `https://<username>.github.io/<repository-name>/`

If repository name is exactly `<username>.github.io`, URL is:

- `https://<username>.github.io/`
