const mineflayer = require('mineflayer');
const express = require('express');

// ─── Web server to keep Render alive ─────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(PORT, () => console.log(`[Web] Keep-alive server on port ${PORT}`));

// ─── Config ───────────────────────────────────────────────────────────────────
const CONFIG = {
  host: 'Gonners69smp.aternos.me',
  port: 63131,
  username: process.env.BOT_USERNAME || 'AFK_Bot',
  version: process.env.MC_VERSION || '1.20.1',
  reconnectDelay: 10000,
  afkInterval: 30000,
  lookInterval: 5000,
};

let bot = null;
let afkTimer = null;
let lookTimer = null;

function createBot() {
  console.log(`[Bot] Connecting to ${CONFIG.host}:${CONFIG.port} as ${CONFIG.username}`);

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    auth: 'offline',
  });

  bot.on('login', () => {
    console.log('[Bot] Logged in!');
    startAntiAFK();
  });

  bot.on('spawn', () => {
    console.log('[Bot] Spawned in world');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`[Chat] <${username}> ${message}`);
    const owner = process.env.BOT_OWNER || '';
    if (username === owner) handleCommand(message);
  });

  bot.on('kicked', (reason) => {
    console.log(`[Bot] Kicked: ${reason}`);
    stopAntiAFK();
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.error(`[Bot] Error: ${err.message}`);
    stopAntiAFK();
    scheduleReconnect();
  });

  bot.on('end', () => {
    console.log('[Bot] Connection ended');
    stopAntiAFK();
    scheduleReconnect();
  });
}

function startAntiAFK() {
  stopAntiAFK();

  afkTimer = setInterval(() => {
    if (!bot) return;
    try {
      bot.swingArm();
      const action = Math.floor(Math.random() * 3);
      if (action === 0) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 200);
      } else if (action === 1) {
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 300);
      } else {
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 200);
      }
      console.log('[AFK] Anti-AFK action performed');
    } catch (e) {
      console.error('[AFK] Error:', e.message);
    }
  }, CONFIG.afkInterval);

  lookTimer = setInterval(() => {
    if (!bot) return;
    try {
      const yaw = (Math.random() * 2 - 1) * Math.PI;
      const pitch = (Math.random() - 0.5) * Math.PI / 2;
      bot.look(yaw, pitch, false);
    } catch (e) {}
  }, CONFIG.lookInterval);

  console.log('[AFK] Anti-AFK started');
}

function stopAntiAFK() {
  if (afkTimer) { clearInterval(afkTimer); afkTimer = null; }
  if (lookTimer) { clearInterval(lookTimer); lookTimer = null; }
}

function scheduleReconnect() {
  console.log(`[Bot] Reconnecting in ${CONFIG.reconnectDelay / 1000}s...`);
  setTimeout(() => {
    if (bot) { try { bot.quit(); } catch (e) {} bot = null; }
    createBot();
  }, CONFIG.reconnectDelay);
}

function handleCommand(message) {
  const cmd = message.trim().toLowerCase();
  if (cmd === '!stop') { bot.chat('Stopping...'); stopAntiAFK(); }
  else if (cmd === '!start') { bot.chat('Starting anti-AFK!'); startAntiAFK(); }
  else if (cmd === '!pos') {
    const p = bot.entity.position;
    bot.chat(`Position: ${Math.floor(p.x)}, ${Math.floor(p.y)}, ${Math.floor(p.z)}`);
  } else if (cmd === '!ping') {
    bot.chat(`Pong! Ping: ${bot.player?.ping ?? '?'}ms`);
  }
}

createBot();
