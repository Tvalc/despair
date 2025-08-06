function initGame() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        alert("Missing canvas element!");
        return;
    }
    if (typeof window.Game === 'undefined') {
        setTimeout(initGame, 40);
        return;
    }
    window.snibGame = new window.Game(canvas);
}
window.addEventListener('DOMContentLoaded', initGame);