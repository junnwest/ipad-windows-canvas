// Simulates an iPad connecting and sending strokes.
// Run while the desktop app is open:
//   node test-client.js

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to desktop app');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Received:', msg.type, msg.type === 'welcome' ? `(${msg.deviceName})` : '');

  if (msg.type === 'welcome') {
    // Wait a moment, then draw a diagonal line
    setTimeout(() => simulateStroke(), 500);
  }

  if (msg.type === 'pong') {
    const latency = Date.now() - msg.timestamp;
    console.log(`  Latency: ${latency}ms`);
  }
});

ws.on('close', () => {
  console.log('Disconnected');
});

ws.on('error', (err) => {
  console.error('Connection failed:', err.message);
  console.log('Make sure the desktop app is running first (npm start)');
});

function simulateStroke() {
  const strokeId = 'test-' + Date.now();
  const numPoints = 40;

  console.log('Drawing a diagonal line...');

  // Send points in batches of 5 (like the iPad would)
  for (let batch = 0; batch < numPoints; batch += 5) {
    const points = [];
    for (let i = batch; i < Math.min(batch + 5, numPoints); i++) {
      const t = i / numPoints;
      points.push({
        x: 0.1 + t * 0.6,       // normalized 0-1
        y: 0.1 + t * 0.6,
        pressure: 0.3 + Math.sin(t * Math.PI) * 0.4,  // vary pressure
        timestamp: Date.now(),
      });
    }

    // Stagger batches like real drawing (16ms apart)
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'stroke_update',
        stroke: {
          id: strokeId,
          points: points,
          color: '#000000',
          width: 3.0,
          tool: 'pen',
        },
      }));
    }, batch * 16);
  }

  // Send stroke_complete after all batches
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'stroke_complete', strokeId }));
    console.log('  Line stroke complete');
  }, numPoints * 16 + 100);

  // After the line, draw a circle
  setTimeout(() => simulateCircle(), 1500);
}

function simulateCircle() {
  const strokeId = 'test-circle-' + Date.now();
  const numPoints = 60;
  const points = [];

  console.log('Drawing a circle...');

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    points.push({
      x: 0.5 + Math.cos(angle) * 0.15,   // centered, radius 0.15
      y: 0.4 + Math.sin(angle) * 0.15,
      pressure: 0.5,
      timestamp: Date.now(),
    });
  }

  // Send all at once
  ws.send(JSON.stringify({
    type: 'stroke_update',
    stroke: {
      id: strokeId,
      points: points,
      color: '#000000',
      width: 2.0,
      tool: 'pen',
    },
  }));

  // Send stroke_complete for circle
  ws.send(JSON.stringify({ type: 'stroke_complete', strokeId }));
  console.log('  Circle stroke complete');

  // Ping test for latency
  setTimeout(() => {
    console.log('Testing latency...');
    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
  }, 500);

  // Disconnect after demo
  setTimeout(() => {
    console.log('Test complete. Disconnecting...');
    ws.close();
  }, 2000);
}
