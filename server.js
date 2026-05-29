// Servidor HTTP custom: Next.js (front + API) + hub WebSocket nativo en /ws.
// Reemplaza `next start`. Las route handlers y el hub corren en el MISMO proceso,
// así que triggerEvent() (src/lib/realtime/server.ts) emite a estas conexiones
// vía globalThis.__cnpRealtimeHub.
//
//   Producción:  NODE_ENV=production node server.js   (tras `next build`)
//   Desarrollo:  node server.js

const { createServer } = require('node:http');
const { parse } = require('node:url');
const crypto = require('node:crypto');
const fs = require('node:fs');
const next = require('next');
const { WebSocketServer } = require('ws');

// ── Cargar .env.local si las vars no vienen del entorno (PM2/systemd) ──
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || '';

const app = next({ dev });
const handle = app.getRequestHandler();

// ── Utilidades de auth (HS256, compatible con jose/signToken) ──
function getCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function verifyJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf-8'));
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

app.prepare().then(() => {
  // getUpgradeHandler() requiere que prepare() ya haya corrido.
  const upgradeHandler = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  // Hub compartido con las route handlers vía globalThis.
  if (!globalThis.__cnpRealtimeHub) globalThis.__cnpRealtimeHub = { clients: new Set() };
  const hub = globalThis.__cnpRealtimeHub;

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, payload) => {
    ws.isAlive = true;
    ws.userRole = payload && payload.role;
    hub.clients.add(ws);
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('close', () => hub.clients.delete(ws));
    ws.on('error', () => hub.clients.delete(ws));
    try {
      ws.send(JSON.stringify({ channel: 'system', event: 'connected', data: {} }));
    } catch {}
  });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '');

    if (pathname === '/ws') {
      const cookieHeader = req.headers.cookie || '';
      const token = getCookie(cookieHeader, 'crm-token') || getCookie(cookieHeader, 'admin-token');
      const payload = token ? verifyJwt(token) : null;

      if (!payload) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, payload);
      });
      return;
    }

    // Resto de upgrades (HMR de Next en dev, etc.)
    upgradeHandler(req, socket, head);
  });

  // Heartbeat: descarta conexiones muertas (proxies/idle).
  const heartbeat = setInterval(() => {
    for (const ws of hub.clients) {
      if (ws.isAlive === false) {
        try { ws.terminate(); } catch {}
        hub.clients.delete(ws);
        continue;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch {}
    }
  }, 30_000);
  wss.on('close', () => clearInterval(heartbeat));

  server.listen(port, hostname, () => {
    console.log(`> Listo en http://${hostname}:${port} — WebSocket en /ws (dev=${dev})`);
  });
});
