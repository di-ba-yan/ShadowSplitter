// 影子分身游戏 - Shadow Splitter
class ShadowSplitterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小
        this.resizeCanvas();
        
        // 游戏状态
        this.keys = {};
        this.keysPressed = {};
        this.gameState = 'playing';
        
        // 物理常量
        this.gravity = 0.6;
        this.friction = 0.85;
        this.jumpPower = 16;
        this.moveSpeed = 0.8;
        this.maxSpeed = 8;
        
        // 游戏对象
        this.player = this.createPlayer(100, 300);
        this.shadow = null;
        this.bullets = [];
        this.enemies = [];
        this.platforms = [];
        this.collectibles = [];
        
        // 影子分身系统
        this.shadowActions = [];
        this.actionFrame = 0;
        this.shadowDelay = 90; // 1.5秒延迟
        this.maxActions = 1000;
        
        // 游戏数据
        this.score = 0;
        this.level = 1;
        this.maxLevel = 5;
        this.levelComplete = false;
        this.levelTransitionTime = 0;
        this.gameComplete = false;
        
        // 关卡配置
        this.levelConfigs = this.createLevelConfigs();
        
        this.initLevel();
        this.bindEvents();
        this.gameLoop();
    }
    
    resizeCanvas() {
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = window.innerHeight * 0.8;
        const aspectRatio = 16 / 9;
        
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }
    
    createPlayer(x, y) {
        return {
            x: x,
            y: y,
            width: 32,
            height: 48,
            vx: 0,
            vy: 0,
            onGround: false,
            direction: 1,
            health: 100,
            shootCooldown: 0,
            type: 'player'
        };
    }
    
    createLevelConfigs() {
        return [
            // 关卡 1 - 基础训练
            {
                name: "基础训练",
                description: "学习基本操作和影子分身",
                platforms: [
                    { x: 0, y: 0.85, width: 1, height: 0.15 },
                    { x: 0.15, y: 0.65, width: 0.15, height: 0.03 },
                    { x: 0.4, y: 0.5, width: 0.15, height: 0.03 },
                    { x: 0.7, y: 0.6, width: 0.15, height: 0.03 }
                ],
                enemies: [
                    { x: 0.25, y: 0.6, type: 'normal' },
                    { x: 0.55, y: 0.45, type: 'shadow' }
                ],
                collectibles: [
                    { x: 0.2, y: 0.6, type: 'coin' },
                    { x: 0.45, y: 0.45, type: 'coin' }
                ]
            },
            // 关卡 2 - 协作挑战
            {
                name: "协作挑战",
                description: "需要本体和分身配合",
                platforms: [
                    { x: 0, y: 0.85, width: 0.3, height: 0.15 },
                    { x: 0.4, y: 0.85, width: 0.3, height: 0.15 },
                    { x: 0.8, y: 0.85, width: 0.2, height: 0.15 },
                    { x: 0.15, y: 0.65, width: 0.1, height: 0.03 },
                    { x: 0.35, y: 0.45, width: 0.1, height: 0.03 },
                    { x: 0.55, y: 0.65, width: 0.1, height: 0.03 },
                    { x: 0.75, y: 0.45, width: 0.1, height: 0.03 }
                ],
                enemies: [
                    { x: 0.2, y: 0.8, type: 'normal' },
                    { x: 0.45, y: 0.8, type: 'shadow' },
                    { x: 0.6, y: 0.6, type: 'normal' },
                    { x: 0.8, y: 0.4, type: 'shadow' }
                ],
                collectibles: [
                    { x: 0.18, y: 0.6, type: 'coin' },
                    { x: 0.38, y: 0.4, type: 'coin' },
                    { x: 0.58, y: 0.6, type: 'coin' },
                    { x: 0.78, y: 0.4, type: 'coin' }
                ]
            },
            // 关卡 3 - 垂直挑战
            {
                name: "垂直挑战",
                description: "考验跳跃和射击技巧",
                platforms: [
                    { x: 0, y: 0.9, width: 0.2, height: 0.1 },
                    { x: 0.8, y: 0.9, width: 0.2, height: 0.1 },
                    { x: 0.1, y: 0.75, width: 0.1, height: 0.03 },
                    { x: 0.3, y: 0.6, width: 0.1, height: 0.03 },
                    { x: 0.5, y: 0.45, width: 0.1, height: 0.03 },
                    { x: 0.7, y: 0.3, width: 0.1, height: 0.03 },
                    { x: 0.4, y: 0.15, width: 0.2, height: 0.03 }
                ],
                enemies: [
                    { x: 0.85, y: 0.85, type: 'normal' },
                    { x: 0.32, y: 0.55, type: 'shadow' },
                    { x: 0.52, y: 0.4, type: 'normal' },
                    { x: 0.72, y: 0.25, type: 'shadow' },
                    { x: 0.45, y: 0.1, type: 'normal' }
                ],
                collectibles: [
                    { x: 0.12, y: 0.7, type: 'coin' },
                    { x: 0.32, y: 0.55, type: 'coin' },
                    { x: 0.52, y: 0.4, type: 'coin' },
                    { x: 0.72, y: 0.25, type: 'coin' },
                    { x: 0.45, y: 0.1, type: 'key' }
                ]
            },
            // 关卡 4 - 迷宫关卡
            {
                name: "影子迷宫",
                description: "复杂地形中的战斗",
                platforms: [
                    { x: 0, y: 0.9, width: 1, height: 0.1 },
                    { x: 0.1, y: 0.75, width: 0.15, height: 0.03 },
                    { x: 0.35, y: 0.75, width: 0.15, height: 0.03 },
                    { x: 0.6, y: 0.75, width: 0.15, height: 0.03 },
                    { x: 0.85, y: 0.75, width: 0.15, height: 0.03 },
                    { x: 0.2, y: 0.6, width: 0.1, height: 0.03 },
                    { x: 0.45, y: 0.6, width: 0.1, height: 0.03 },
                    { x: 0.7, y: 0.6, width: 0.1, height: 0.03 },
                    { x: 0.1, y: 0.45, width: 0.1, height: 0.03 },
                    { x: 0.35, y: 0.45, width: 0.1, height: 0.03 },
                    { x: 0.6, y: 0.45, width: 0.1, height: 0.03 },
                    { x: 0.85, y: 0.45, width: 0.1, height: 0.03 },
                    { x: 0.25, y: 0.3, width: 0.5, height: 0.03 }
                ],
                enemies: [
                    { x: 0.15, y: 0.85, type: 'normal' },
                    { x: 0.4, y: 0.7, type: 'shadow' },
                    { x: 0.65, y: 0.7, type: 'normal' },
                    { x: 0.9, y: 0.7, type: 'shadow' },
                    { x: 0.22, y: 0.55, type: 'normal' },
                    { x: 0.47, y: 0.55, type: 'shadow' },
                    { x: 0.72, y: 0.55, type: 'normal' },
                    { x: 0.5, y: 0.25, type: 'shadow' }
                ],
                collectibles: [
                    { x: 0.12, y: 0.7, type: 'coin' },
                    { x: 0.37, y: 0.7, type: 'coin' },
                    { x: 0.62, y: 0.7, type: 'coin' },
                    { x: 0.87, y: 0.7, type: 'coin' },
                    { x: 0.22, y: 0.55, type: 'coin' },
                    { x: 0.47, y: 0.55, type: 'coin' },
                    { x: 0.5, y: 0.25, type: 'key' }
                ]
            },
            // 关卡 5 - 最终Boss
            {
                name: "最终对决",
                description: "与强大的Boss战斗",
                platforms: [
                    { x: 0, y: 0.9, width: 1, height: 0.1 },
                    { x: 0.1, y: 0.7, width: 0.2, height: 0.03 },
                    { x: 0.7, y: 0.7, width: 0.2, height: 0.03 },
                    { x: 0.35, y: 0.5, width: 0.3, height: 0.03 },
                    { x: 0.2, y: 0.3, width: 0.1, height: 0.03 },
                    { x: 0.7, y: 0.3, width: 0.1, height: 0.03 }
                ],
                enemies: [
                    { x: 0.15, y: 0.85, type: 'normal' },
                    { x: 0.75, y: 0.85, type: 'shadow' },
                    { x: 0.12, y: 0.65, type: 'normal' },
                    { x: 0.72, y: 0.65, type: 'shadow' },
                    { x: 0.45, y: 0.45, type: 'boss' },
                    { x: 0.22, y: 0.25, type: 'normal' },
                    { x: 0.72, y: 0.25, type: 'shadow' }
                ],
                collectibles: [
                    { x: 0.15, y: 0.65, type: 'coin' },
                    { x: 0.75, y: 0.65, type: 'coin' },
                    { x: 0.4, y: 0.45, type: 'key' },
                    { x: 0.6, y: 0.45, type: 'key' },
                    { x: 0.22, y: 0.25, type: 'coin' },
                    { x: 0.72, y: 0.25, type: 'coin' }
                ]
            }
        ];
    }
    
    initLevel() {
        const config = this.levelConfigs[this.level - 1];
        if (!config) return;
        
        // 重置状态
        this.levelComplete = false;
        this.levelTransitionTime = 0;
        
        // 重置玩家位置
        this.player.x = 50;
        this.player.y = this.height * 0.5;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.health = 100;
        
        // 销毁分身
        this.shadow = null;
        this.shadowActions = [];
        this.bullets = [];
        
        // 创建平台
        this.platforms = config.platforms.map(p => ({
            x: p.x * this.width,
            y: p.y * this.height,
            width: p.width * this.width,
            height: p.height * this.height
        }));
        
        // 创建敌人
        this.enemies = config.enemies.map(e => ({
            x: e.x * this.width,
            y: e.y * this.height,
            width: e.type === 'boss' ? 40 : 28,
            height: e.type === 'boss' ? 40 : 28,
            type: e.type,
            health: e.type === 'boss' ? 3 : 1,
            maxHealth: e.type === 'boss' ? 3 : 1,
            vx: 0,
            vy: 0,
            onGround: false,
            shootCooldown: 0,
            direction: 1
        }));
        
        // 创建收集品
        this.collectibles = config.collectibles.map(c => ({
            x: c.x * this.width,
            y: c.y * this.height,
            width: 16,
            height: 16,
            type: c.type,
            collected: false
        }));
        
        console.log(`关卡 ${this.level}: ${config.name} 已加载`);
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            this.keysPressed[key] = true;
            
            if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.initLevel();
        });
    }
    
    update() {
        this.actionFrame++;
        
        if (this.gameState === 'paused') return;
        if (this.gameState === 'victory') {
            if (this.keysPressed['r']) {
                this.restartGame();
            }
            this.keysPressed = {};
            return;
        }
        
        if (this.gameState !== 'playing') return;
        
        // 处理关卡过渡
        if (this.levelComplete && this.levelTransitionTime > 0) {
            this.levelTransitionTime--;
            if (this.levelTransitionTime <= 0) {
                if (this.gameComplete) {
                    this.gameState = 'victory';
                } else {
                    this.nextLevel();
                }
            }
            return;
        }
        
        this.handleInput();
        this.updatePlayer();
        this.updateShadow();
        this.updateBullets();
        this.updateEnemies();
        this.checkCollisions();
        this.updateUI();
        
        this.keysPressed = {};
    }
    
    nextLevel() {
        this.level++;
        this.initLevel();
        console.log(`进入关卡 ${this.level}`);
    }
    
    handleInput() {
        // 移动
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.vx -= this.moveSpeed;
            this.player.direction = -1;
            this.recordAction('move', -1);
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.player.vx += this.moveSpeed;
            this.player.direction = 1;
            this.recordAction('move', 1);
        }
        
        // 跳跃
        if ((this.keysPressed['w'] || this.keysPressed['arrowup']) && this.player.onGround) {
            this.player.vy = -this.jumpPower;
            this.player.onGround = false;
            this.recordAction('jump');
        }
        
        // 射击
        if (this.keysPressed[' '] && this.player.shootCooldown <= 0) {
            this.createBullet(this.player, 'player');
            this.player.shootCooldown = 15;
            this.recordAction('shoot');
        }
        
        // 创建/销毁分身
        if (this.keysPressed['q']) {
            if (!this.shadow) {
                this.createShadow();
            } else {
                this.destroyShadow();
            }
        }
        
        // 暂停游戏
        if (this.keysPressed['escape']) {
            this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
        }
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.levelComplete = false;
        this.levelTransitionTime = 0;
        this.gameComplete = false;
        this.gameState = 'playing';
        this.actionFrame = 0;
        this.initLevel();
        console.log('游戏重新开始！');
    }
    
    recordAction(type, data = null) {
        this.shadowActions.push({
            type: type,
            data: data,
            frame: this.actionFrame
        });
        
        if (this.shadowActions.length > this.maxActions) {
            this.shadowActions.shift();
        }
    }
    
    createShadow() {
        this.shadow = this.createPlayer(this.player.x, this.player.y);
        this.shadow.type = 'shadow';
        this.shadow.startFrame = this.actionFrame;
    }
    
    destroyShadow() {
        this.shadow = null;
    }
    
    createBullet(shooter, type) {
        this.bullets.push({
            x: shooter.x + shooter.width / 2,
            y: shooter.y + shooter.height / 2,
            width: 6,
            height: 6,
            vx: shooter.direction * 12,
            vy: 0,
            shooter: type
        });
    }
    
    updatePlayer() {
        this.player.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.player.vx));
        
        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown--;
        }
        
        this.applyPhysics(this.player);
    }
    
    updateShadow() {
        if (!this.shadow) return;
        
        const targetFrame = this.actionFrame - this.shadowDelay;
        const actions = this.shadowActions.filter(action => action.frame === targetFrame);
        
        actions.forEach(action => {
            switch (action.type) {
                case 'move':
                    this.shadow.vx += action.data * this.moveSpeed;
                    this.shadow.direction = action.data;
                    break;
                case 'jump':
                    if (this.shadow.onGround) {
                        this.shadow.vy = -this.jumpPower;
                        this.shadow.onGround = false;
                    }
                    break;
                case 'shoot':
                    if (this.shadow.shootCooldown <= 0) {
                        this.createBullet(this.shadow, 'shadow');
                        this.shadow.shootCooldown = 15;
                    }
                    break;
            }
        });
        
        this.shadow.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.shadow.vx));
        
        if (this.shadow.shootCooldown > 0) {
            this.shadow.shootCooldown--;
        }
        
        this.applyPhysics(this.shadow);
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            return bullet.x > -50 && bullet.x < this.width + 50 && 
                   bullet.y > -50 && bullet.y < this.height + 50;
        });
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.type === 'boss') {
                const playerDistance = Math.abs(this.player.x - enemy.x);
                const shadowDistance = this.shadow ? Math.abs(this.shadow.x - enemy.x) : Infinity;
                const closestDistance = Math.min(playerDistance, shadowDistance);
                
                if (closestDistance < 200) {
                    const targetX = playerDistance < shadowDistance ? this.player.x : (this.shadow ? this.shadow.x : this.player.x);
                    if (targetX < enemy.x) {
                        enemy.vx = -3;
                        enemy.direction = -1;
                    } else {
                        enemy.vx = 3;
                        enemy.direction = 1;
                    }
                    
                    if (enemy.shootCooldown <= 0 && closestDistance < 150) {
                        this.createBullet(enemy, 'enemy');
                        enemy.shootCooldown = 40;
                    }
                } else {
                    enemy.vx = Math.sin(this.actionFrame * 0.01) * 2;
                }
            } else {
                const playerDistance = Math.abs(this.player.x - enemy.x);
                const shadowDistance = this.shadow ? Math.abs(this.shadow.x - enemy.x) : Infinity;
                const closestDistance = Math.min(playerDistance, shadowDistance);
                
                if (closestDistance < 100) {
                    const targetX = playerDistance < shadowDistance ? this.player.x : (this.shadow ? this.shadow.x : this.player.x);
                    if (targetX < enemy.x) {
                        enemy.vx = -1.5;
                        enemy.direction = -1;
                    } else {
                        enemy.vx = 1.5;
                        enemy.direction = 1;
                    }
                } else {
                    enemy.vx = Math.sin(this.actionFrame * 0.02) * 1;
                }
            }
            
            if (enemy.shootCooldown > 0) {
                enemy.shootCooldown--;
            }
            
            this.applyPhysics(enemy);
        });
    }
    
    applyPhysics(entity) {
        entity.vy += this.gravity;
        entity.vx *= this.friction;
        
        entity.x += entity.vx;
        entity.y += entity.vy;
        
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        }
        if (entity.x + entity.width > this.width) {
            entity.x = this.width - entity.width;
            entity.vx = 0;
        }
        
        entity.onGround = false;
        this.platforms.forEach(platform => {
            if (this.checkCollision(entity, platform)) {
                if (entity.vy > 0 && entity.y < platform.y) {
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.onGround = true;
                }
                else if (entity.vy < 0 && entity.y > platform.y) {
                    entity.y = platform.y + platform.height;
                    entity.vy = 0;
                }
                else if (entity.vx > 0 && entity.x < platform.x) {
                    entity.x = platform.x - entity.width;
                    entity.vx = 0;
                }
                else if (entity.vx < 0 && entity.x > platform.x) {
                    entity.x = platform.x + platform.width;
                    entity.vx = 0;
                }
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    const canDefeat = (enemy.type === 'normal' && bullet.shooter === 'player') ||
                                    (enemy.type === 'shadow' && bullet.shooter === 'shadow') ||
                                    (enemy.type === 'boss');
                    
                    if (canDefeat) {
                        enemy.health--;
                        if (enemy.health <= 0) {
                            this.enemies.splice(enemyIndex, 1);
                            this.score += enemy.type === 'boss' ? 500 : 100;
                        }
                    }
                    this.bullets.splice(bulletIndex, 1);
                }
            });
        });
        
        this.collectibles.forEach((item, index) => {
            if (!item.collected) {
                if (this.checkCollision(this.player, item) || 
                    (this.shadow && this.checkCollision(this.shadow, item))) {
                    item.collected = true;
                    this.score += item.type === 'key' ? 200 : 50;
                }
            }
        });
        
        this.checkLevelComplete();
    }
    
    checkLevelComplete() {
        if (this.levelComplete) return;
        
        const allEnemiesDefeated = this.enemies.length === 0;
        const allCollectiblesGathered = this.collectibles.every(item => item.collected);
        
        if (allEnemiesDefeated && allCollectiblesGathered) {
            this.levelComplete = true;
            this.levelTransitionTime = 180;
            this.score += 1000;
            
            if (this.level >= this.maxLevel) {
                this.gameComplete = true;
            }
        }
    }
    
    updateUI() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = this.score;
        
        const levelElement = document.getElementById('level');
        if (levelElement) levelElement.textContent = this.level;
        
        const healthElement = document.getElementById('health');
        if (healthElement) healthElement.textContent = this.player.health + '%';
        
        const healthBarElement = document.getElementById('healthBar');
        if (healthBarElement) healthBarElement.style.width = this.player.health + '%';
        
        const shadowStatusElement = document.getElementById('shadowStatus');
        if (shadowStatusElement) {
            shadowStatusElement.textContent = this.shadow ? '激活' : '未激活';
            shadowStatusElement.style.color = this.shadow ? '#8A2BE2' : '#999';
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.renderPlatforms();
        this.renderCollectibles();
        this.renderPlayer(this.player);
        
        if (this.shadow) {
            this.renderPlayer(this.shadow);
        }
        
        this.renderEnemies();
        this.renderBullets();
        this.renderGameUI();
    }
    
    renderPlatforms() {
        this.platforms.forEach(platform => {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
    }
    
    renderCollectibles() {
        this.collectibles.forEach(item => {
            if (item.collected) return;
            
            const time = this.actionFrame * 0.1;
            const bounce = Math.sin(time) * 3;
            
            if (item.type === 'coin') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(item.x + 8, item.y + 8 + bounce, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFA500';
                this.ctx.beginPath();
                this.ctx.arc(item.x + 8, item.y + 8 + bounce, 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (item.type === 'key') {
                this.ctx.fillStyle = '#C0C0C0';
                this.ctx.fillRect(item.x + 5, item.y + 8 + bounce, 10, 4);
                this.ctx.fillRect(item.x + 12, item.y + 5 + bounce, 3, 10);
                this.ctx.fillRect(item.x + 12, item.y + 12 + bounce, 5, 3);
            }
        });
    }
    
    renderPlayer(player) {
        this.ctx.save();
        
        if (player.type === 'player') {
            const gradient = this.ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
            gradient.addColorStop(0, '#4A90E2');
            gradient.addColorStop(1, '#2E5BBA');
            this.ctx.fillStyle = gradient;
        } else {
            const gradient = this.ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
            gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
            gradient.addColorStop(1, 'rgba(75, 0, 130, 0.8)');
            this.ctx.fillStyle = gradient;
        }
        
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        
        this.ctx.fillStyle = player.type === 'player' ? 'white' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(player.x + 8, player.y + 12, 6, 6);
        this.ctx.fillRect(player.x + 18, player.y + 12, 6, 6);
        
        this.ctx.fillStyle = player.type === 'player' ? '#333' : 'rgba(51, 51, 51, 0.8)';
        this.ctx.fillRect(player.x + 10 + player.direction, player.y + 14, 2, 2);
        this.ctx.fillRect(player.x + 20 + player.direction, player.y + 14, 2, 2);
        
        this.ctx.restore();
    }
    
    renderEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            
            if (enemy.type === 'boss') {
                const pulse = Math.sin(this.actionFrame * 0.1) * 0.1 + 0.9;
                this.ctx.globalAlpha = pulse;
                
                const gradient = this.ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
                gradient.addColorStop(0, '#FF4500');
                gradient.addColorStop(0.5, '#FF6347');
                gradient.addColorStop(1, '#DC143C');
                this.ctx.fillStyle = gradient;
                
                this.ctx.shadowColor = '#FF4500';
                this.ctx.shadowBlur = 15;
                
            } else if (enemy.type === 'normal') {
                const gradient = this.ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
                gradient.addColorStop(0, '#FF6B6B');
                gradient.addColorStop(1, '#E74C3C');
                this.ctx.fillStyle = gradient;
            } else {
                const gradient = this.ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
                gradient.addColorStop(0, '#9B59B6');
                gradient.addColorStop(1, '#8E44AD');
                this.ctx.fillStyle = gradient;
            }
            
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            
            if (enemy.maxHealth > 1) {
                const barWidth = enemy.width;
                const barHeight = 4;
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                this.ctx.fillRect(enemy.x, enemy.y - 8, barWidth, barHeight);
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
                this.ctx.fillRect(enemy.x, enemy.y - 8, barWidth * (enemy.health / enemy.maxHealth), barHeight);
            }
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = enemy.type === 'boss' ? 'bold 16px Arial' : 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            const label = enemy.type === 'normal' ? 'N' : enemy.type === 'shadow' ? 'S' : 'BOSS';
            this.ctx.fillText(label, enemy.x + enemy.width/2, enemy.y + enemy.height/2 + 4);
            
            this.ctx.restore();
        });
    }
    
    renderBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.shooter === 'player' ? '#FFD700' : 
                               bullet.shooter === 'shadow' ? 'rgba(255, 215, 0, 0.8)' : '#FF4500';
            this.ctx.fillRect(bullet.x - 3, bullet.y - 3, 6, 6);
        });
    }
    
    renderGameUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 80);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`分数: ${this.score}`, 20, 30);
        this.ctx.fillText(`关卡: ${this.level}/${this.maxLevel}`, 20, 50);
        this.ctx.fillText(`敌人: ${this.enemies.length}`, 20, 70);
        
        if (this.shadow) {
            this.ctx.fillStyle = '#8A2BE2';
            this.ctx.fillText('分身激活', 150, 30);
        }
        
        const config = this.levelConfigs[this.level - 1];
        if (config) {
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(config.name, 150, 50);
        }
        
        if (this.levelComplete && this.levelTransitionTime > 0) {
            this.renderLevelTransition();
        }
        
        if (this.gameState === 'victory') {
            this.renderVictoryScreen();
        }
        
        if (this.gameState === 'paused') {
            this.renderPauseScreen();
        }
    }
    
    renderLevelTransition() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('关卡完成！', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`分数: ${this.score}`, this.width / 2, this.height / 2);
        
        if (!this.gameComplete) {
            this.ctx.fillText(`准备进入关卡 ${this.level + 1}...`, this.width / 2, this.height / 2 + 40);
        } else {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('准备最终结算...', this.width / 2, this.height / 2 + 40);
        }
        
        const progress = 1 - (this.levelTransitionTime / 180);
        const barWidth = 300;
        const barHeight = 10;
        const barX = this.width / 2 - barWidth / 2;
        const barY = this.height / 2 + 80;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }
    
    renderPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.width / 2, this.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('按 ESC 继续游戏', this.width / 2, this.height / 2 + 50);
    }
    
    renderVictoryScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 64px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎉 胜利！ 🎉', this.width / 2, this.height / 2 - 100);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px Arial';
        this.ctx.fillText('恭喜通关所有关卡！', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillText(`最终分数: ${this.score}`, this.width / 2, this.height / 2 + 20);
        
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`完成关卡: ${this.maxLevel}/${this.maxLevel}`, this.width / 2, this.height / 2 + 60);
        
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('按 R 键重新开始游戏', this.width / 2, this.height / 2 + 120);
        
        const alpha = Math.sin(this.actionFrame * 0.1) * 0.3 + 0.7;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('🌟 影子分身大师 🌟', this.width / 2, this.height / 2 + 160);
        this.ctx.restore();
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new ShadowSplitterGame();
});