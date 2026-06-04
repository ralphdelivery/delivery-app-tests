// The whole backend. It does 4 things:
//   1. Serves the web page
//   2. Lists all orders
//   3. Adds a new order
//   4. Changes an order's status (deliver / delivered)
//
// Orders are saved in a plain file called orders.json so they survive restarts.

import express from "express";
import fs from "fs";

const app = express();
const PORT = 3000;
const DATA_FILE = "orders.json";

app.use(express.json());          // lets us read JSON sent to the API
app.use(express.static("public")); // serves the web page in /public

// --- tiny "database": just read/write a JSON file ---
function loadOrders() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return []; // no file yet = no orders
  }
}
function saveOrders(orders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

// --- API: get every order ---
app.get("/orders", (req, res) => {
  res.json(loadOrders());
});

// --- API: turn typed text into real, identified addresses ---
// Proxies OpenStreetMap's free Nominatim geocoder. We do it server-side so we
// can send a proper User-Agent (Nominatim requires one) instead of hitting it
// from every browser. Returns a short list of matches with coordinates.
app.get("/geocode", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 3) return res.json([]); // too short to be a useful search

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2" +
      "&addressdetails=1&limit=5&countrycodes=us&q=" +
      encodeURIComponent(q);

    const r = await fetch(url, {
      headers: {
        // Nominatim's usage policy asks for an identifying User-Agent.
        "User-Agent": "Ralph-Delivery-App/1.0 (mathieu.c.miller@gmail.com)",
      },
    });
    const places = await r.json();

    // Hand the browser only what it needs: a label + coordinates.
    res.json(
      places.map((p) => ({
        label: p.display_name,
        lat: Number(p.lat),
        lon: Number(p.lon),
      }))
    );
  } catch (err) {
    console.error("Geocode failed:", err);
    res.status(502).json({ error: "Could not look up that address." });
  }
});

// --- API: add a new order (this is the endpoint your "businesses" call) ---
app.post("/orders", (req, res) => {
  const { what, pickup, dropoff, pickupCoords, dropoffCoords } = req.body;
  if (!what) {
    return res.status(400).json({ error: "An order needs a 'what'." });
  }
  const orders = loadOrders();
  const newOrder = {
    id: Date.now(),                // simple unique id
    what,
    pickup: pickup || "",
    dropoff: dropoff || "",
    pickupCoords: pickupCoords || null,   // { lat, lon } once geocoded
    dropoffCoords: dropoffCoords || null,
    status: "waiting",             // waiting -> delivering -> delivered
  };
  orders.push(newOrder);
  saveOrders(orders);
  res.json(newOrder);
});

// --- API: change an order's status ---
app.post("/orders/:id/status", (req, res) => {
  const { status } = req.body;
  const orders = loadOrders();
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found." });
  order.status = status;
  saveOrders(orders);
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`\n✅ Delivery app running!`);
  console.log(`   Open this in your browser:  http://localhost:${PORT}\n`);
});
