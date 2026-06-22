# Deploying

The game is a Vue SPA (built by Vite) plus a small PHP API, served together from
shared hosting. There is no Node on the server — deploys upload the built files
over FTP.

**Deploy target: `windwalk.de/foot/`** (a subfolder). The app is preconfigured
for this path — Vite `base`, the router, the API client, and `.htaccess` are all
set to `/foot/`. To move it, change those four spots (see `public/.htaccess`).

## Layout after a deploy (inside the `foot/` folder)

```
foot/                 index.html, favicon.ico, assets/<hashed>  (the built SPA)
foot/.htaccess        SPA routing + secret protection (from public/.htaccess)
foot/api/             _bootstrap.php, auth.php, save.php          (the PHP API)
foot/api/config.php   DB credentials — uploaded ONCE by hand, never by a deploy
```

## One-time setup

1. **Database** — in your host's control panel, create a MySQL database; note the
   host, database name, user, and password.
2. **Schema** — import `api/schema.sql` once (e.g. via phpMyAdmin) into that DB.
3. **config.php** — copy `api/config.sample.php` → `api/config.php`, set
   `'driver' => 'mysql'`, and fill in the credentials.
4. **Upload `config.php` once, by hand** (FTP/SFTP) into the `foot/api/` folder
   (i.e. `<web-root>/foot/api/config.php`). It is git-ignored, never staged,
   never synced, and survives every deploy. The `.htaccess` also denies serving
   it as text.
5. **GitHub secrets** (repo → Settings → Secrets and variables → Actions):
   - `FTP_SERVER` — e.g. `ftp.your-host.example`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`
   - `FTP_SERVER_DIR` — the path to the **`foot/` folder** as seen from the FTP
     login, **with a trailing slash**. If the login lands in the web root, that's
     `foot/`; if it lands above it, e.g. `public_html/foot/` or `windwalk.de/foot/`.
6. **HTTPS** — enable "Force HTTPS / SSL redirect" in your hosting control panel
   (the safest option — it's proxy-aware). Alternatively, uncomment the HTTPS
   block in `public/.htaccess` (tested loop-safe for direct-TLS and
   `X-Forwarded-Proto` hosts) — but read Troubleshooting first.

## Shipping updates

- **Push to deploy (primary):** `git push origin master`. The *Deploy* GitHub
  Action builds and FTP-syncs automatically — only changed files, never deleting.
- **Manual fallback:** copy `.env.example` → `.env` (git-ignored), fill in the
  `FTP_*` values, then `npm run deploy`.

Both paths build, stage `api/` next to the SPA (minus `config.php`, the sample,
the schema, and `data/`), and upload — never deleting server files, so
`config.php` and any `/api/data` stay put.

## Troubleshooting

- **Redirect loop / "too many redirects":** the HTTPS block is enabled but your
  host terminates TLS upstream without sending `X-Forwarded-Proto`. Re-comment
  the HTTPS block in `public/.htaccess` and use the control-panel "Force HTTPS"
  toggle instead.
- **500 on `/api/...`:** usually `config.php` missing or wrong DB credentials (a
  PHP `require` fatal). Check the host's PHP error log; confirm `/api/config.php`
  exists, uses the `mysql` driver, and has valid credentials.
- **Deep-link 404 (refresh on `/team` 404s):** `.htaccess` not deployed, or the
  host disables `.htaccess` overrides. Confirm `/.htaccess` is in the web root
  (it ships from `public/`) and that `mod_rewrite` / overrides are allowed.
- **`config.php` gone after a deploy:** it shouldn't be — deploys never touch it.
  Re-upload it by hand. If it ever downloads as text instead of executing, PHP
  isn't running on the host (the `.htaccess` deny still protects it).
- **FTP connection fails:** in the workflow try `protocol: ftps-legacy` (implicit
  TLS, add `port: 990`) or `ftp`; for the local script set `FTP_SECURE=false`.
