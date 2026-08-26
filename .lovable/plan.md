# Fix: "Cannot read properties of null (reading 'useMemo')" crash

## Root cause
The preview loaded two different Vite dependency prebundle versions (`?v=3f403847` and `?v=fc81e508`) at the same time. That created **two copies of React** in the browser — the second copy has a null internal dispatcher, so any hook call (e.g. `useMemo` inside a Radix/provider component) crashes the whole app. This is a stale `node_modules/.vite` cache issue, and the config has no `react` dedupe to guard against it.

## Fix (small, config-only)
1. **Clear the stale Vite cache** — delete `node_modules/.vite` and restart the dev server so all prebundles are rebuilt under one version hash.
2. **Add `resolve.dedupe: ["react", "react-dom"]` to `vite.config.ts`** — forces every dependency to share a single React instance, preventing this class of crash from recurring when the cache gets mixed again.

No source/component changes needed; no database changes.

## Note on the previous plan
The bulk photo upload plan for Site Profiles was set aside after rejection — happy to revisit or adjust it if you'd like.
