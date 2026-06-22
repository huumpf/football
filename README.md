# football

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Accounts & saved games

Each player has an account (email + password); their whole game is stored as one
JSON blob and autosaved as they play. A small PHP + MySQL API under `api/` handles
sign-in and load/save; the SPA talks to it same-origin, so login is a session
cookie.

### Running the API locally

The API runs against SQLite locally, so no MySQL is needed:

```
cp api/config.sample.php api/config.php   # then set 'driver' => 'sqlite'
php -S 127.0.0.1:8000 -t .                # serve the API on :8000
npm run dev                                # Vite proxies /api to it
```

Open the Vite URL, create an account, and play — progress persists across
reloads. In production, `api/config.php` uses the `mysql` driver and the tables
in `api/schema.sql` are created once on the database.
