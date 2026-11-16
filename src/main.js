import './styles.css';
import { createGame } from './core/createGame.js';

const root = document.querySelector('#game-root');
const loadingScreen = document.querySelector('#loading-screen');
const errorPanel = document.querySelector('#game-error');

try {
  const game = createGame(root);

  game.start();
  loadingScreen?.classList.add('is-hidden');

  window.addEventListener('beforeunload', () => game.destroy(), { once: true });
} catch (error) {
  console.error('COS could not start:', error);

  if (loadingScreen) loadingScreen.classList.add('is-hidden');
  if (errorPanel) {
    errorPanel.hidden = false;
    errorPanel.textContent =
      'The 3D preview could not start. Please check that your browser supports WebGL and try again.';
  }
}
