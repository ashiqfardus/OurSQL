# Publishing OurSQL globally

> ⚠️ The bare name `oursql` is already taken on npm (an abandoned ORM, last
> published 2022). Recommended: publish under your **npm scope** —
> `@your-npm-username/oursql`. The installed *command* stays `oursql`; only the
> install id is scoped.

## 1. npm (the real distribution channel)

```bash
# log in once
npm login

# OPTION A — scoped (recommended, always available)
#   edit package.json:  "name": "@your-npm-username/oursql"
npm publish --access public
#   users then run:  npm i -g @your-npm-username/oursql

# OPTION B — a different free name (check first)
npm view oursql-cli            # 404 = available
#   edit package.json "name", then:
npm publish
```

Verify after publishing:

```bash
npm i -g @your-npm-username/oursql
oursql --version
```

## 2. GitHub (home base)

`gh` (GitHub CLI) is **not installed** on this machine. Either install it
(`winget install GitHub.cli`) or create the repo in the browser, then:

```bash
git init
git add .
git commit -m "OurSQL 1.0.0 — the communal database 🐒"
git branch -M main
git remote add origin https://github.com/ashiqfardus/oursql.git
git push -u origin main
git tag v1.0.0 && git push --tags
```

Then update the `ashiqfardus` placeholders in `package.json` and the formula.

## 3. Homebrew (macOS/Linux)

A formula is in `packaging/homebrew/oursql.rb`. Easiest path is your own tap:

```bash
# 1. create a repo named  homebrew-oursql  on GitHub
# 2. drop oursql.rb in it (fill in the sha256 — see the comment in the file)
# 3. users install with:
brew tap ashiqfardus/oursql
brew install oursql
```

Getting into `homebrew-core` requires notability criteria (stars/usage) — the tap
is the right move for a fresh project.

## 4. winget (Windows) — honest note

winget installs MSI/EXE/ZIP artifacts, **not** npm packages, so a Node CLI doesn't
map cleanly. To ship via winget you'd first bundle OurSQL into a standalone `.exe`
(e.g. with `pkg` or `node --sea`), publish that as a GitHub Release asset, then
submit a manifest to `microsoft/winget-pkgs`. That's a real chunk of work beyond the
npm path. **Recommendation:** lead with npm (covers Windows fine via `npm i -g`), and
add winget later only if there's demand. Say the word and I'll wire up the SEA build
+ manifest.
