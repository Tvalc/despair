class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = 'menu'; // menu, playing, gameover
        this.width = canvas.width;
        this.height = canvas.height;
        this.player = new window.Player(this.width / 2, this.height - 80);
        this.projectiles = [];
        this.enemies = [];
        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 0.85;
        this.enemySpeed = 90;
        this.difficultyTimer = 0;
        this.input = { left: false, right: false, up: false, down: false, space: false };
        this.lastFrameTime = 0;
        this.keyPressed = {};
        this.explosionSounds = [];
        this.gameOverTimer = 0;
        this.flashTimer = 0;

        // New property for ShipFormation
        this.shipFormation = null;

        this.bindEvents();
        this.render(); // Show menu or first frame immediately
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (this.state === 'menu' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startGame();
            }
            if (this.state === 'gameover' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startGame();
            }
            if (this.state === 'playing') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
                if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.up = true;
                if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = true;
                if (e.code === 'Space') this.input.space = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (this.state === 'playing') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
                if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.up = false;
                if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = false;
                if (e.code === 'Space') this.input.space = false;
            }
        });
        // Mouse for menu buttons (optional)
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.state === 'menu') {
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                if (mx > this.width / 2 - 90 && mx < this.width / 2 + 90 && my > this.height / 2 + 30 && my < this.height / 2 + 80) {
                    this.startGame();
                }
            }
            if (this.state === 'gameover') {
                const rect = this.canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                if (mx > this.width / 2 - 90 && mx < this.width / 2 + 90 && my > this.height / 2 + 42 && my < this.height / 2 + 92) {
                    this.startGame();
                }
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.player = new window.Player(this.width / 2, this.height - 80);
        this.projectiles = [];
        this.enemies = [];
        this.enemySpawnTimer = 0.8;
        this.enemySpeed = 90;
        this.difficultyTimer = 0;
        this.flashTimer = 0;
        this.lastFrameTime = performance.now();
        this.shipFormation = null; // Reset ShipFormation
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameOver() {
        this.state = 'gameover';
        if (this.score > this.highScore) this.highScore = this.score;
        this.gameOverTimer = 0.9;

        // Create the ship formation for the game over screen
        this.shipFormation = new window.ShipFormation(this.width, this.height);

        this.render();
    }

    gameLoop(now) {
        let dt = (now - this.lastFrameTime) / 1000;
        if (dt > 0.07) dt = 0.07; // clamp to avoid spiral-of-death
        this.lastFrameTime = now;
        if (this.state === 'playing') {
            this.update(dt);
            this.render();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    update(dt) {
        // Difficulty increases over time
        this.difficultyTimer += dt;
        if (this.difficultyTimer > 1.0 && this.enemySpawnInterval > 0.26) {
            this.enemySpawnInterval -= 0.008;
            this.enemySpeed += 3.5;
            this.difficultyTimer = 0;
        }

        // Player movement
        const moveSpeed = 280;
        if (this.input.left) this.player.x -= moveSpeed * dt;
        if (this.input.right) this.player.x += moveSpeed * dt;
        if (this.input.up) this.player.y -= moveSpeed * dt;
        if (this.input.down) this.player.y += moveSpeed * dt;

        // Clamp player position
        this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

        this.player.update(dt, this.input);

        // Shooting
        if (this.input.space) {
            if (this.player.shoot(this.projectiles)) {
                this.flashTimer = 0.08;
                this.playShootSound();
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(dt);
            if (this.projectiles[i].y < -10) this.projectiles.splice(i, 1);
        }

        // Spawn enemies
        this.enemySpawnTimer -= dt;
        if (this.enemySpawnTimer <= 0) {
            // Randomly choose type
            let type = Math.random() < 0.2 ? 1 : 0; // 20% big
            let rad = type === 1 ? 20 : 15;
            let ex = rad + Math.random() * (this.width - rad * 2);
            this.enemies.push(new window.Enemy(ex, -rad - 12, this.enemySpeed + Math.random() * 55, type));
            this.enemySpawnTimer = this.enemySpawnInterval + Math.random() * 0.22;
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.update(dt);
            if (enemy.isAlive && this.player.invincible === false && this.circleCollides(this.player.x, this.player.y, this.player.radius, enemy.x, enemy.y, enemy.radius)) {
                // Player hit!
                this.lives--;
                this.playExplosionSound();
                enemy.explode();
                this.player.invincible = true;
                this.player.invincibleTimer = 1.0;
                if (this.lives <= 0) {
                    setTimeout(() => this.gameOver(), 600);
                } else {
                    this.player.respawn(this.width, this.height);
                }
            }
            // Remove offscreen or exploded
            if (!enemy.isAlive && enemy.explodeTimer <= 0) {
                this.enemies.splice(i, 1);
                continue;
            }
            if (enemy.y > this.height + enemy.radius + 12) {
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // Projectiles vs enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                let e = this.enemies[j];
                if (e.isAlive && this.circleCollides(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
                    // Hit!
                    this.score += e.type === 1 ? 50 : 20;
                    this.playExplosionSound();
                    e.explode();
                    this.projectiles.splice(i, 1);
                    break;
                }
            }
        }

        if (this.flashTimer > 0) this.flashTimer -= dt;
    }

    circleCollides(x1, y1, r1, x2, y2, r2) {
        let dx = x1 - x2, dy = y1 - y2;
        return (dx * dx + dy * dy) < (r1 + r2) * (r1 + r2);
    }

    // ---- UI & DRAWING ----
    render() {
        const ctx = this.ctx;
        // Optional: flashing background when shooting
        if (this.flashTimer > 0) {
            ctx.fillStyle = "#2d4fa0";
            ctx.globalAlpha = 0.18 + 0.18 * Math.abs(Math.sin(Date.now() * 0.08));
        } else {
            ctx.fillStyle = "#101423";
            ctx.globalAlpha = 1;
        }
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.globalAlpha = 1;

        // Draw background stars
        this.drawStars(ctx);

        // State UI
        if (this.state === 'menu') {
            this.drawTitle(ctx);
        } else if (this.state === 'gameover') {
            // Update and render the ship formation
            if (this.shipFormation) {
                this.shipFormation.update(1 / 60);
                this.shipFormation.render(ctx);

                // Draw the "dev is gay" message above GAME OVER
                ctx.save();
                ctx.font = "bold 38px 'Segoe UI', Arial, sans-serif";
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.shadowColor = "#5aa0fa";
                ctx.shadowBlur = 12;
                ctx.fillText("dev is gay", this.width / 2, this.height / 2 - 90);
                ctx.restore();
            }
            this.drawGameOver(ctx);
        }

        if (this.state === 'playing') {
            // Enemies
            for (let e of this.enemies) e.render(ctx);

            // Projectiles
            for (let p of this.projectiles) p.render(ctx);

            // Player
            this.player.render(ctx);

            // HUD: Score and Lives
            ctx.save();
            ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
            ctx.fillStyle = "#fff";
            ctx.shadowColor = "#5aa0fa";
            ctx.shadowBlur = 4;
            ctx.fillText("SCORE: " + this.score, 18, 34);
            ctx.shadowBlur = 0;

            // Lives (draw ships)
            for (let i = 0; i < this.lives; i++) {
                ctx.save();
                ctx.translate(this.width - 110 + i * 32, 24);
                ctx.scale(0.7, 0.7);
                ctx.globalAlpha = 0.84;
                ctx.beginPath();
                ctx.moveTo(0, -16);
                ctx.lineTo(-12, 14);
                ctx.lineTo(12, 14);
                ctx.closePath();
                ctx.fillStyle = "#5aa0fa";
                ctx.shadowColor = "#7fd0ff";
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
        }

        // High score
        ctx.save();
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#e2f5ff";
        ctx.globalAlpha = 0.76;
        ctx.fillText("HI-SCORE: " + this.highScore, 18, this.height - 18);
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawStars(ctx) {
        // Static pseudo-random starfield
        ctx.save();
        for (let i = 0; i < 65; i++) {
            let x = (i * 67) % this.width + (Math.sin(i * 3.17) * 31);
            let y = (i * 89) % this.height + (Math.cos(i * 2.13) * 11);
            let r = (i % 3) === 0 ? 2.1 : 1.1;
            ctx.globalAlpha = 0.22 + 0.33 * ((i % 3) / 2);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawTitle(ctx) {
        ctx.save();
        ctx.font = "bold 46px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.shadowColor = "#5aa0fa";
        ctx.shadowBlur = 18;
        ctx.fillText("SPACE SHOOTER", this.width / 2, this.height / 2 - 80);
        ctx.shadowBlur = 0;
        ctx.font = "22px Arial, sans-serif";
        ctx.fillStyle = "#e2f5ff";
        ctx.globalAlpha = 0.8;
        ctx.fillText("Arrow keys or WASD to move", this.width / 2, this.height / 2 - 10);
        ctx.fillText("Spacebar to shoot", this.width / 2, this.height / 2 + 22);
        ctx.globalAlpha = 1;

        // Start button
        ctx.beginPath();
        ctx.roundRect(this.width / 2 - 90, this.height / 2 + 30, 180, 50, 18);
        ctx.fillStyle = "#5aa0fa";
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = "bold 28px Arial, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("START", this.width / 2, this.height / 2 + 65);
        ctx.restore();
    }

    drawGameOver(ctx) {
        ctx.save();
        ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = "#fa5050";
        ctx.textAlign = "center";
        ctx.shadowColor = "#f15050";
        ctx.shadowBlur = 12;
        ctx.fillText("GAME OVER", this.width / 2, this.height / 2 - 40);
        ctx.shadowBlur = 0;

        ctx.font = "24px Arial, sans-serif";
        ctx.fillStyle = "#e2f5ff";
        ctx.globalAlpha = 0.82;
        ctx.fillText("SCORE: " + this.score, this.width / 2, this.height / 2 + 7);
        ctx.globalAlpha = 1;

        // Restart button
        ctx.beginPath();
        ctx.roundRect(this.width / 2 - 90, this.height / 2 + 42, 180, 50, 18);
        ctx.fillStyle = "#5aa0fa";
        ctx.globalAlpha = 0.94;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.font = "bold 26px Arial, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("RESTART", this.width / 2, this.height / 2 + 77);
        ctx.restore();
    }

    // ---- AUDIO FEEDBACK (SFX) ----
    // All sounds are beep-like, procedurally generated
    playShootSound() {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle';
            o.frequency.value = 490;
            g.gain.value = 0.06;
            o.connect(g).connect(ctx.destination);
            o.start();
            o.frequency.linearRampToValueAtTime(870, ctx.currentTime + 0.06);
            o.stop(ctx.currentTime + 0.12);
            o.onended = () => ctx.close();
        } catch {}
    }
    playExplosionSound() {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = 160;
            g.gain.value = 0.11;
            o.connect(g).connect(ctx.destination);
            o.start();
            o.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.16);
            g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
            o.stop(ctx.currentTime + 0.20);
            o.onended = () => ctx.close();
        } catch {}
    }
}
window.Game = Game;