/* Simple placeholder icons - replace with actual icon files */
/* This creates a basic canvas-based icon for the extension */

const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, 0, 128, 128);

// Book icon
ctx.fillStyle = '#38bdf8';
ctx.fillRect(32, 20, 64, 88);
ctx.fillStyle = '#0f172a';
ctx.fillRect(40, 28, 48, 72);

// Pages
ctx.strokeStyle = '#38bdf8';
ctx.lineWidth = 2;
for (let i = 0; i < 5; i++) {
  ctx.beginPath();
  ctx.moveTo(50, 35 + i * 12);
  ctx.lineTo(78, 35 + i * 12);
  ctx.stroke();
}
