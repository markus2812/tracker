# Tracker

Приватний трекер стану та звичок з офлайн-режимом, локальними чернетками і серверною синхронізацією для домашнього ноутбука.

## Що вже є

- PWA фронтенд на `React + Vite`
- локальний кеш і чернетки в `IndexedDB`
- маленький API на `Node.js + SQLite`
- одна база, яку можуть використовувати і web-застосунок, і Telegram-асистент

## Як запускати локально

У двох терміналах:

```powershell
npm install
npm run api
```

```powershell
npm run dev:host
```

Фронтенд буде доступний на `http://<твій-ip>:5173`, а всі запити `/api` Vite прокине на API `http://127.0.0.1:3210`.

## Як запускати як один сервіс на домашньому ноуті

```powershell
npm install
npm run build
npm run serve
```

Після цього сервер:

- віддає API на `/api/*`
- віддає зібраний фронтенд з `dist`
- зберігає дані у `data/tracker.sqlite`

За замовчуванням сервер слухає `0.0.0.0:3210`.

## Змінні середовища

- `TRACKER_HOST` - хост для API/серверу, за замовчуванням `0.0.0.0`
- `TRACKER_PORT` - порт, за замовчуванням `3210`
- `TRACKER_DB_PATH` - шлях до SQLite-файлу, за замовчуванням `data/tracker.sqlite`
- `VITE_API_BASE_URL` - необов'язковий базовий URL API для фронтенда; без нього використовується `/api`

## API

### `GET /api/health`

Повертає стан сервера.

### `GET /api/entries`

Опціональні query-параметри:

- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

### `GET /api/entries/:date`

Повертає один запис за датою.

### `PUT /api/entries/:date`

Створює або оновлює запис за датою.

Тіло запиту:

```json
{
  "version": 1,
  "date": "2026-03-24",
  "energy": 7,
  "mood": 6,
  "focus": 8,
  "deepWork": 90,
  "workout": true,
  "webcam": false,
  "mj": false,
  "alcohol": false,
  "nicotineBefore12": false,
  "craving": 2,
  "notes": "Спокійний день",
  "createdAt": "2026-03-24T18:00:00.000Z",
  "updatedAt": "2026-03-24T18:05:00.000Z"
}
```

### `GET /api/settings`

Повертає налаштування.

### `PUT /api/settings`

Оновлює налаштування.

## Telegram-асистент

Найпростіший варіант інтеграції:

1. Бот живе на тому ж ноуті або в тій же Tailscale-мережі.
2. Бот читає записи через `GET /api/entries`.
3. Бот створює або править записи через `PUT /api/entries/:date`.

Так і web, і Telegram працюють з однією SQLite-базою.
