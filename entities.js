// --- PLAYER ---
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        // Updated size parameters for the player ship
        this.radius = 30; // Increased from 22
        this.width = 50; // Increased from 34
        this.height = 65; // Increased from 44
        this.color = "#5aa0fa";
        this.lives = 3;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.shootCooldown = 0;
        this.score = 0;

        // Sprite management
        this.sprite = new Image();
        this.sprite.src = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/SS1_1754423390196.png"; // Default forward sprite
        this.sprites = {
            forward: "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/SS1_1754423390196.png",
            left: "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/SSL_1754423402924.png",
            right: "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/SSR_1754423418569.png",
        };
        this.currentDirection = "forward"; // Tracks the current movement direction
    }

    update(dt, input) {
        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        if (this.shootCooldown > 0) this.shootCooldown -= dt;

        // Update sprite based on movement input
        if (input.left) {
            this.setDirection("left");
        } else if (input.right) {
            this.setDirection("right");
        } else if (input.up || input.down) {
            this.setDirection("forward");
        }
    }

    setDirection(direction) {
        if (this.currentDirection !== direction) {
            this.currentDirection = direction;
            this.sprite.src = this.sprites[direction];
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.invincible) {
            ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(Date.now() * 0.012));
        }

        // Draw the sprite
        ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
    }

    shoot(projectiles) {
        if (this.shootCooldown <= 0) {
            projectiles.push(new Projectile(this.x, this.y - this.height / 2 - 10, -370)); // Adjusted projectile spawn position
            this.shootCooldown = 0.22; // seconds
            return true;
        }
        return false;
    }

    respawn(canvasW, canvasH) {
        this.x = canvasW / 2;
        this.y = canvasH - 100; // Adjusted respawn position to account for larger size
        this.invincible = true;
        this.invincibleTimer = 1.5;
    }
}
window.Player = Player;

// --- ENEMY ---
class Enemy {
    constructor(x, y, speed, type = 0) {
        this.x = x;
        this.y = y;
        this.radius = type === 1 ? 20 : 15;
        this.type = type; // 0: small, 1: big
        this.speed = speed;
        this.isAlive = true;
        this.color = type === 1 ? "#f15050" : "#fab85a";
        this.explodeTimer = 0;

        // Animation properties
        this.animationFrames = [];
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameInterval = 0.1; // Time per frame in seconds

        // Load animation frames
        this.loadAnimationFrames();
    }

    loadAnimationFrames() {
        const frameUrls = [
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/Enemy_Ship_1_1753824654660.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/Enemy_Ship_2_1753824672446.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/Enemy_Ship_3_1753824680227.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/Enemy_Ship_4_1753824688771.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/Enemy_Ship_5_1753824699044.png",
            "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/0f84fe06-5c42-40c3-b563-1a28d18f37cc/library/Enemy_Ship_6_1753824709971.png",
        ];

        for (const url of frameUrls) {
            const img = new Image();
            img.src = url;
            this.animationFrames.push(img);
        }
    }

    update(dt) {
        this.y += this.speed * dt;
        if (!this.isAlive) {
            this.explodeTimer -= dt;
        }

        // Update animation frame
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.animationFrames.length;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.isAlive) {
            // Explosion effect
            ctx.globalAlpha = Math.max(this.explodeTimer, 0) / 0.4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 18 * (1 - ctx.globalAlpha), 0, Math.PI * 2);
            ctx.fillStyle = "#fff7b1";
            ctx.shadowColor = "#fff7b1";
            ctx.shadowBlur = 16;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        // Body
        if (this.isAlive) {
            const frame = this.animationFrames[this.currentFrame];
            if (frame) {
                ctx.drawImage(frame, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
            }
        }
        ctx.restore();
    }

    explode() {
        this.isAlive = false;
        this.explodeTimer = 0.4;
    }
}
window.Enemy = Enemy;

// --- PROJECTILE ---
class Projectile {
    constructor(x, y, velocityY) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.velocityY = velocityY;
        this.color = "#87f7ff";
    }

    update(dt) {
        this.y += this.velocityY * dt;
    }

    render(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = "#87f7ff";
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.82;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
window.Projectile = Projectile;

// --- SHIP FORMATION ---
class ShipFormation {
    constructor(canvasWidth, canvasHeight) {
        this.ships = [];
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2 - 100;
        this.radius = 120;
        this.angle = 0;
        this.targetPositions = [];
        this.animationComplete = false;

        // Initialize ships
        for (let i = 0; i < 8; i++) {
            this.ships.push({
                x: Math.random() * canvasWidth,
                y: canvasHeight + 50,
                angle: (i / 8) * Math.PI * 2,
                targetX: 0,
                targetY: 0,
                reachedTarget: false,
            });
        }

        // Define target positions for the letters "DEV IS GAY"
        const letterPositions = [
            { x: -90, y: -30 }, // D
            { x: -60, y: -30 }, // E
            { x: -30, y: -30 }, // V
            { x: 0, y: -30 },   // (space)
            { x: 30, y: -30 },  // I
            { x: 60, y: -30 },  // S
            { x: 90, y: -30 },  // G
            { x: 120, y: -30 }, // A
        ];

        this.targetPositions = letterPositions.map(pos => ({
            x: this.centerX + pos.x,
            y: this.centerY + pos.y,
        }));
    }

    update(dt) {
        if (this.animationComplete) return;

        // Move ships into circular formation
        this.angle += dt * 1.5; // Rotate the circle
        for (let i = 0; i < this.ships.length; i++) {
            const ship = this.ships[i];
            if (!ship.reachedTarget) {
                const target = this.targetPositions[i];
                const dx = target.x - ship.x;
                const dy = target.y - ship.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 2) {
                    ship.reachedTarget = true;
                    ship.x = target.x;
                    ship.y = target.y;
                } else {
                    ship.x += dx * dt * 2;
                    ship.y += dy * dt * 2;
                }
            }
        }

        // Check if all ships have reached their targets
        this.animationComplete = this.ships.every(ship => ship.reachedTarget);
    }

    render(ctx) {
        ctx.save();
        for (const ship of this.ships) {
            ctx.save();
            ctx.translate(ship.x, ship.y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(-8, 10);
            ctx.lineTo(8, 10);
            ctx.closePath();
            ctx.fillStyle = "#5aa0fa";
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }
}
window.ShipFormation = ShipFormation;