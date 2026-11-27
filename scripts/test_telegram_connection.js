#!/usr/bin/env node
/**
 * RISKOS Telegram Alert Verification Script
 * ==============================================================================
 * Usage: node scripts/test_telegram_connection.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env
const envPath = path.resolve(__dirname, '..', '.env');
let token = '9084753837:AAEkaXnQqFu0On_sa8DeHjYYkuPkM7-K3Ck';
let chatId = '74646806981';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('TELEGRAM_BOT_TOKEN=')) token = trimmed.split('=')[1].replace(/["']/g, '');
    if (trimmed.startsWith('TELEGRAM_CHAT_ID=')) chatId = trimmed.split('=')[1].replace(/["']/g, '');
  });
}

console.log('Testing Telegram Bot Connection:');
console.log('Bot Token:', token ? `${token.slice(0, 10)}...` : 'MISSING');
console.log('Chat ID:', chatId);

async function checkAndSend() {
  // 1. Fetch updates to see if user has messaged the bot
  const updates = await new Promise((resolve) => {
    https.get(`https://api.telegram.org/bot${token}/getUpdates`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });

  if (updates && updates.result && updates.result.length > 0) {
    const lastMsg = updates.result[updates.result.length - 1];
    if (lastMsg && lastMsg.message && lastMsg.message.chat) {
      const detectedChatId = String(lastMsg.message.chat.id);
      console.log(`Detected active chat from @${lastMsg.message.from.username || lastMsg.message.from.first_name}: Chat ID = ${detectedChatId}`);
      if (detectedChatId !== chatId) {
        chatId = detectedChatId;
        // Update .env
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/TELEGRAM_CHAT_ID=.*/, `TELEGRAM_CHAT_ID=${detectedChatId}`);
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log(`Updated .env with detected Chat ID: ${detectedChatId}`);
      }
    }
  }

  // 2. Send test alert
  const msgText = '🏛️ *RISKOS 24/7 Sovereign Intelligence Connected!*\n\n' +
    '✅ *System Status*: ACTIVE & SYNCHRONIZED\n' +
    '📈 *12-Factor Pricing*: Monitoring 134 Equities\n' +
    '⚡ *WebSeer Radar*: Scanning for Discontinuous Shocks & Catalysts\n' +
    '🛡️ *Pre-Trade Risk*: Circuit Breakers Armored\n\n' +
    '_You will receive immediate high-conviction alerts here 24/7._';

  const postData = JSON.stringify({
    chat_id: chatId,
    text: msgText,
    parse_mode: 'Markdown'
  });

  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      const resp = JSON.parse(body);
      if (resp.ok) {
        console.log('\n✅ SUCCESS: Test alert delivered to your Telegram phone!');
      } else {
        console.log('\n❌ TELEGRAM RESPONSE:', resp.description);
        console.log('👉 Please open https://t.me/riskos_market_bot and tap START, then run this again.');
      }
    });
  });

  req.on('error', (e) => console.error('Error:', e.message));
  req.write(postData);
  req.end();
}

checkAndSend();
