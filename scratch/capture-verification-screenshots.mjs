import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Administrator\\.gemini\\antigravity-ide\\brain\\4651f146-9867-4898-9b0d-1d935e6c7ee5';
const proc = spawn(chromePath, [
  '--headless',
  '--window-size=1440,900',
  '--disable-gpu',
  '--remote-debugging-port=9877',
  'http://localhost:3020/login'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await sleep(2500);
  const res = await fetch('http://localhost:9877/json');
  const tabs = await res.json();
  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('3020'));
  if (!pageTab) {
    console.error('No page tab');
    proc.kill();
    return;
  }
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && callbacks.has(d.id)) {
      const { resolve, reject } = callbacks.get(d.id);
      callbacks.delete(d.id);
      if (d.error) reject(d.error);
      else resolve(d.result);
    }
  };

  await new Promise(res => ws.onopen = res);
  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Logging in...');
  await sleep(2000);
  await send('Runtime.evaluate', {
    expression: `(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passInput = document.querySelector('input[type="password"]');
      const submitBtn = document.querySelector('button[type="submit"]');
      if (emailInput && passInput && submitBtn) {
        emailInput.value = 'sales.anv@remixoil.vn';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.value = '123456';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        submitBtn.click();
      }
    })()`
  });

  await sleep(4000);

  const waitForContentAndSnap = async (url, filename) => {
    console.log(`Navigating to ${url}...`);
    await send('Page.navigate', { url });
    // Wait until content renders or up to 8s
    await sleep(8000);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot ${filename}`);
  };

  await waitForContentAndSnap('http://localhost:3020/san-pham', 'feature_san_pham_3tier_208l.png');
  await waitForContentAndSnap('http://localhost:3020/don-hang', 'feature_don_hang_kanban_credit.png');
  await waitForContentAndSnap('http://localhost:3020/vo-phuy', 'feature_vo_phuy_tracking.png');

  ws.close();
  proc.kill();
  console.log('Done capturing loaded screenshots.');
}

run().catch(err => {
  console.error(err);
  proc.kill();
});
