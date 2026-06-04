# 📦 Delivery App

A dead-simple delivery board. People send in orders, and anyone with access to the app can pick one up and deliver it.

## What it does

- **Anyone can add an order** (what to deliver, pickup, dropoff) → it shows as `waiting`
- **Anyone can tap "I'll deliver this"** → it becomes `delivering`
- **Anyone can tap "Mark delivered"** → it's done and leaves the list

Everyone who opens the link sees the same shared list. No accounts, no API keys.

## Run it

```bash
npm install   # one time, downloads dependencies
npm start     # starts the server
```

Then open **http://localhost:3000** in your browser.

## Sending orders via the API

```
POST http://localhost:3000/orders
Content-Type: application/json

{ "what": "Pizza", "pickup": "Mario's Pizzeria", "dropoff": "123 Oak St" }
```

## How it's built

| File | What it is |
|------|------------|
| `server.js` | The backend — API + storage (Node.js + Express) |
| `public/index.html` | The web page everyone sees |
| `orders.json` | Auto-created file where orders are saved |
