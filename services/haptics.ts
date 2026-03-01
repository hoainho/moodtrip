/**
 * Lightweight haptic feedback for PWA.
 */
export function hapticLight() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticMedium() {
  if ('vibrate' in navigator) {
    navigator.vibrate(25);
  }
}

export function hapticSuccess() {
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 50, 20]);
  }
}

export function hapticError() {
  if ('vibrate' in navigator) {
    navigator.vibrate([30, 50, 30, 50, 30]);
  }
}

export function hapticHeavy() {
  if ('vibrate' in navigator) {
    navigator.vibrate(40);
  }
}

export function hapticWarning() {
  if ('vibrate' in navigator) {
    navigator.vibrate([20, 40, 20]);
  }
}

export function hapticSelection() {
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
}

export function hapticNotification() {
  if ('vibrate' in navigator) {
    navigator.vibrate([15, 30, 15, 30, 15]);
  }
}

/**
 * Spawn confetti particles from a point.
 * Uses plain DOM — no dependencies.
 */
export function spawnConfetti(x?: number, y?: number) {
  const colors = ['#0d9488', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ec4899', '#a78bfa'];
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;`;
  document.body.appendChild(container);

  const cx = x ?? window.innerWidth / 2;
  const cy = y ?? window.innerHeight / 2;

  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 300 + 150;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 200;
    const rotation = Math.random() * 720 - 360;

    particle.style.cssText = `
      position:absolute;
      left:${cx}px;top:${cy}px;
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      opacity:1;
      transition:all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform:translate(0,0) rotate(0deg) scale(1);
    `;
    container.appendChild(particle);

    requestAnimationFrame(() => {
      particle.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotation}deg) scale(0)`;
      particle.style.opacity = '0';
    });
  }

  setTimeout(() => container.remove(), 1200);
}
