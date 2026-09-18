# M&A Theory Learning Map

An interactive, static learning map for Vietnam Finance Case Competition preparation. It turns the theory curriculum for Weeks 2, 3, and 6 into a navigable root → week → topic tree, while keeping detailed subtopics and readings in a focused side panel.

The interface is designed as a calm study aid rather than a dashboard or grading tool. Completion status is personal progress only and is never presented as an academic score.

## Technology stack

- React 19 and TypeScript in strict mode
- Vite
- `@xyflow/react` for the interactive node-link surface
- `@dagrejs/dagre` for top-to-bottom and left-to-right graph layouts
- `html-to-image` (lazy-loaded) for high-resolution client-side PNG exports
- Plain CSS with responsive and reduced-motion styles
- Vitest and Ajv for focused tests and curriculum validation
- ESLint with TypeScript and React Hooks rules

No backend, authentication, database, analytics, or AI API is used.

## Setup

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm ci
npm run dev
```

Vite will print the local development URL. The application works entirely in the browser.

For team handoff, commit `package-lock.json` and ask collaborators to use `npm ci` so everyone installs the same dependency tree. Users of nvm can run `nvm use`; the included `.nvmrc` selects Node 20.

## Commands

```bash
npm run dev             # start the development server
npm run validate:data   # validate JSON schema, IDs, and source references
npm run type-check      # type-check the TypeScript project
npm test                # run the focused test suite once
npm run test:watch      # run tests in watch mode
npm run lint            # run ESLint
npm run build           # type-check and create a production build
npm run check           # validate data, test, lint, and build in one command
npm run preview         # preview the production build locally
```

## Architecture

The implementation keeps curriculum content, graph logic, layout, persistence, and rendering separate:

- `data/curriculum.json` is the authoritative application content.
- `data/curriculum.schema.json` defines its development-time contract.
- `src/types/` contains strict curriculum and graph types.
- `src/data/curriculum.ts` validates the JSON at runtime, indexes topics, and resolves source records.
- `src/lib/buildGraph.ts` applies week, search, and collapsed-branch visibility while retaining required ancestors.
- `src/lib/layoutGraph.ts` calculates node positions with Dagre.
- `src/lib/searchCurriculum.ts` searches topic titles, summaries, and subtopics.
- `src/lib/validateCurriculum.ts` enforces the browser-side data boundary and filters unsafe source URLs.
- `src/lib/exportMap.ts` creates full-bounds PNG captures and portable progress/curriculum JSON files.
- `src/hooks/useStudyProgress.ts` exposes browser-only completion state.
- `src/components/` contains the graph, nodes, controls, progress summary, topic panel, and source list.

Subtopics are intentionally not graph nodes. They appear inside the selected topic panel so the map remains readable.

## Updating the curriculum

Edit `data/curriculum.json` and keep the structure compatible with `data/curriculum.schema.json`.

1. Give every topic and source a stable, unique ID.
2. Keep sources in the top-level `sources` collection.
3. Reference sources from topics with `sourceIds`; do not embed duplicate source records in topics.
4. Use a valid `https://` URL only when a reliable external page exists. Otherwise include the citation and a `verificationNote` without a URL.
5. Run `npm run validate:data`, `npm test`, and `npm run build` after changes.

Stable topic IDs matter because saved completion status is keyed by topic ID.

## Exporting the map and progress

Use **Export** in the map toolbar:

- **Export as PNG** captures every node and edge in the current visible/filtered graph at high resolution. The export is fitted to the complete graph bounds and excludes the toolbar, zoom controls, mini-map, and topic panel.
- **Export Progress & Map Data (JSON)** downloads the complete curriculum with a `completed` flag on every topic, progress totals, the localStorage key, and the current search, week, layout, collapse, and visibility state.

Both exports are generated locally in the browser. No curriculum or progress data is uploaded. On narrow screens the export control becomes a full-width toolbar row; file contents are identical to desktop exports.

## Progress storage

Completed topic IDs are stored in the current browser's `localStorage` under `ma_theory_completed_topics`. Changes synchronize across tabs for the same origin. No progress leaves the device. The in-app reset action requires a confirmation dialog and removes this key. Clearing browser site data also clears progress.

## Static deployment

Run:

```bash
npm run build
```

Deploy the generated `dist/` directory to any static host such as GitHub Pages, Netlify, Vercel, Cloudflare Pages, or an ordinary web server. Configure the host to build with `npm run build` and publish `dist`. The site has no server-side runtime requirements.

The default Vite base is `./`, so one `dist/` build works at a root domain or a nested static path without source edits. If a host requires an absolute public base, provide the build-time environment variable directly, using a slash-terminated value:

```bash
BASE_PATH=/ma-theory-map/ npm run build
```

Before sharing or deploying:

```bash
npm ci
npm run check
npm run preview
```

Netlify can deploy directly from the included `netlify.toml`. For other platforms, use Node 20.19 or newer, `npm run build` as the build command, and `dist` as the publish directory. Because the application has no client-side URL router, rewrite rules and server functions are not required.

## GitHub repository and Pages deployment

To create a new GitHub repository for this project and push the current files, replace the placeholders and run:

```bash
git init
git add .
git commit -m "feat: complete M&A theory learning map with export and deployment"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
git push -u origin main
```

Then open the repository on GitHub and go to **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` checks types, runs tests, builds the app, and publishes `dist/` whenever `main` or `master` is updated. It can also be started manually from the repository's **Actions** tab.

After the first successful deployment, teammates can open:

```text
https://<YOUR_USERNAME>.github.io/<REPO_NAME>/
```

The deployment job also shows the exact public URL in its GitHub environment summary.

For a custom domain, enter the domain under **Settings → Pages → Custom domain** and configure the DNS records GitHub displays. If the domain should live in version control, create `public/CNAME` containing only the hostname (for example, `learn.example.com`); Vite will copy it into `dist/` during each build. Do not commit a placeholder `CNAME`, because it would configure Pages with that literal hostname.

## Source and content disclaimer

This is an educational navigation aid for VFCC preparation, not investment, legal, accounting, or transaction advice. The repository's supplied Week 2 module and VFCC proposal were used directly as local references. Because no original Week 3 or Week 6 curriculum data files were present in the starting repository, those concise records were synthesized from the stated competition scope and cited M&A/valuation references. Students should consult the listed source materials, confirm links and edition details, and follow the official VFCC rules and course materials when they differ from this map.
