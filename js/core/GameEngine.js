// 游戏引擎核心类
export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 游戏状态
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver', 'victory'
        this.currentLevel = 1;
        this.score = 0;
        this.lives = 3;
        
        // 输入系统
        this.keys = {};
        this.keysPressed = {};
        
        // 时间系统
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        
        // 物理常量
        this.gravity = 0.6;
        this.friction = 0.85;
        this.airFriction = 0.98;
        
        // 粒子系统
        this.particles = [];
        
        // 音效系统（占位）
        this.sounds = {
            jump: null,
            shoot: null,
            hit: null,
            enemyDeath: null,
            levelComplete: null
        };
        
        this.bindEvents();
    }
    
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keysPressed[e.key.toLowerCase()] = true;
            
            // 防止默认行为
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // 失去焦点时暂停
        window.addEventListener('blur', () => {
            if (this.gameState === 'playing') {
                this.gameState = 'paused';
            }
        });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // 保持16:9比例
        const aspectRatio = 16 / 9;
        let newWidth = rect.width;
        let newHeight = rect.width / aspectRatio;
        
        if (newHeight > rect.height) {
            newHeight = rect.height;
            newWidth = rect.height * aspectRatio;
        }
        
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.width = newWidth;
        this.height = newHeight;
        
        // 重新设置画布样式
        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = newHeight + 'px';
    }
    
    update(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.gameTime += this.deltaTime;
        
        // 更新粒子
        this.updateParticles();
        
        // 清除按键按下状态
        this.keysPressed = {};
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });
    }
    
    addParticle(x, y, vx, vy, color, life = 60) {
        this.particles.push({
            x, y, vx, vy, color, life,
            maxLife: life,
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.2; // 重力
                this.vx *= 0.98; // 阻力
                this.life--;
            }
        });
    }
    
    createExplosion(x, y, color = '#FFD700', count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 3 + Math.random() * 3;
            this.addParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                30 + Math.random() * 30
            );
        }
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            this.ctx.restore();
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    applyPhysics(entity, platforms) {
        // 重力
        entity.vy += this.gravity;
        
        // 摩擦力
        if (entity.onGround) {
            entity.vx *= this.friction;
        } else {
            entity.vx *= this.airFriction;
        }
        
        // 更新位置
        entity.x += entity.vx;
        entity.y += entity.vy;
        
        // 边界检测
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        }
        if (entity.x + entity.width > this.width) {
            entity.x = this.width - entity.width;
            entity.vx = 0;
        }
        
        // 平台碰撞
        entity.onGround = false;
        platforms.forEach(platform => {
            if (this.checkCollision(entity, platform)) {
                // 从上方落下
                if (entity.vy > 0 && entity.y < platform.y) {
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.onGround = true;
                }
                // 从下方撞击
                else if (entity.vy < 0 && entity.y > platform.y) {
                    entity.y = platform.y + platform.height;
                    entity.vy = 0;
                }
                // 从左侧撞击
                else if (entity.vx > 0 && entity.x < platform.x) {
                    entity.x = platform.x - entity.width;
                    entity.vx = 0;
                }
                // 从右侧撞击
                else if (entity.vx < 0 && entity.x > platform.x) {
                    entity.x = platform.x + platform.width;
                    entity.vx = 0;
                }
            }
        });
        
        // 防止掉出屏幕底部
        if (entity.y > this.height) {
            entity.y = this.height - entity.height;
            entity.vy = 0;
            entity.onGround = true;
            
            // 如果是玩家，扣血
            if (entity.type === 'player' || entity.type === 'shadow') {
                entity.takeDamage(25);
            }
        }
    }
    
    playSound(soundName) {
        // 音效播放占位
        console.log(`Playing sound: ${soundName}`);
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 渲染粒子
        this.renderParticles();
    }
    
    isKeyPressed(key) {
        return this.keysPressed[key] || false;
    }
    
    isKeyDown(key) {
        return this.keys[key] || false;
    }
}