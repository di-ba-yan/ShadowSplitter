// 影子分身游戏 - 完全重写版本
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
    
    initLevel() {
        // 创建平台
        this.platforms = [
            { x: 0, y: this.height - 80, width: this.width, height: 80 }, // 地面
            { x: 200, y: this.height - 200, width: 150, height: 20 },
            { x: 450, y: this.height - 320, width: 150, height: 20 },
            { x: 700, y: this.height - 240, width: 150, height: 20 }
        ];
        
        // 创建敌人
        this.enemies = [
            { x: 300, y: this.height - 260, width: 28, height: 28, type: 'normal', health: 1, vx: 0, vy: 0, onGround: false },
            { x: 600, y: this.height - 380, width: 28, height: 28, type: 'shadow', health: 1, vx: 0, vy: 0, onGround: false }
        ];
        
        // 创建收集品
        this.collectibles = [
            { x: 250, y: this.height - 240, width: 16, height: 16, type: 'coin', collected: false },
            { x: 500, y: this.height - 360, width: 16, height: 16, type: 'coin', collected: false }
        ];
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            this.keysPressed[key] = true;
            
            // 防止默认行为
            if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.initLevel(); // 重新初始化关卡以适应新尺寸
        });
    }
    
    update() {
        this.actionFrame++;
        
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        this.updatePlayer();
        this.updateShadow();
        this.updateBullets();
        this.updateEnemies();
        this.checkCollisions();
        this.updateUI();
        
        // 清除按键按下状态
        this.keysPressed = {};
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
            console.log('Player jumped!'); // 调试信息
        }
        
        // 射击
        if (this.keysPressed[' '] && this.player.shootCooldown <= 0) {
            this.createBullet(this.player, 'player');
            this.player.shootCooldown = 15;
            this.recordAction('shoot');
            console.log('Player shot!'); // 调试信息
        }
        
        // 创建/销毁分身
        if (this.keysPressed['q']) {
            if (!this.shadow) {
                this.createShadow();
                console.log('Shadow created!'); // 调试信息
            } else {
                this.destroyShadow();
                console.log('Shadow destroyed!'); // 调试信息
            }
        }
    }
    
    recordAction(type, data = null) {
        this.shadowActions.push({
            type: type,
            data: data,
            frame: this.actionFrame
        });
        
        // 限制历史记录长度
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
        // 限制速度
        this.player.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.player.vx));
        
        // 更新射击冷却
        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown--;
        }
        
        // 应用物理
        this.applyPhysics(this.player);
    }
    
    updateShadow() {
        if (!this.shadow) return;
        
        // 获取延迟后的动作
        const targetFrame = this.actionFrame - this.shadowDelay;
        const actions = this.shadowActions.filter(action => action.frame === targetFrame);
        
        // 执行动作
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
        
        // 限制速度
        this.shadow.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.shadow.vx));
        
        // 更新射击冷却
        if (this.shadow.shootCooldown > 0) {
            this.shadow.shootCooldown--;
        }
        
        // 应用物理
        this.applyPhysics(this.shadow);
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // 移除超出边界的子弹
            return bullet.x > -50 && bullet.x < this.width + 50 && 
                   bullet.y > -50 && bullet.y < this.height + 50;
        });
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            // 简单AI - 左右移动
            enemy.vx = Math.sin(this.actionFrame * 0.02) * 2;
            this.applyPhysics(enemy);
        });
    }
    
    applyPhysics(entity) {
        // 重力
        entity.vy += this.gravity;
        
        // 摩擦力
        entity.vx *= this.friction;
        
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
        
        // 平台碰撞检测
        entity.onGround = false;
        this.platforms.forEach(platform => {
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
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkCollisions() {
        // 子弹与敌人碰撞
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    // 检查是否可以击败敌人
                    const canDefeat = (enemy.type === 'normal' && bullet.shooter === 'player') ||
                                    (enemy.type === 'shadow' && bullet.shooter === 'shadow');
                    
                    if (canDefeat) {
                        this.enemies.splice(enemyIndex, 1);
                        this.score += 100;
                        console.log('Enemy defeated! Score:', this.score);
                    }
                    this.bullets.splice(bulletIndex, 1);
                }
            });
        });
        
        // 玩家与收集品碰撞
        this.collectibles.forEach((item, index) => {
            if (!item.collected) {
                if (this.checkCollision(this.player, item) || 
                    (this.shadow && this.checkCollision(this.shadow, item))) {
                    item.collected = true;
                    this.score += 50;
                    console.log('Item collected! Score:', this.score);
                }
            }
        });
    }
    
    updateUI() {
        // 更新HTML UI
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
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 背景渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#90EE90');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 渲染平台
        this.renderPlatforms();
        
        // 渲染收集品
        this.renderCollectibles();
        
        // 渲染玩家
        this.renderPlayer(this.player);
        
        // 渲染分身
        if (this.shadow) {
            this.renderPlayer(this.shadow);
        }
        
        // 渲染敌人
        this.renderEnemies();
        
        // 渲染子弹
        this.renderBullets();
        
        // 渲染UI信息
        this.renderGameUI();
    }
    
    renderPlatforms() {
        this.platforms.forEach(platform => {
            // 主体
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // 边框
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
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(item.x + 8, item.y + 8 + bounce, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#FFA500';
            this.ctx.beginPath();
            this.ctx.arc(item.x + 8, item.y + 8 + bounce, 5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    renderPlayer(player) {
        this.ctx.save();
        
        // 主体颜色
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
        
        // 绘制身体
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        
        // 绘制眼睛
        this.ctx.fillStyle = player.type === 'player' ? 'white' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(player.x + 8, player.y + 12, 6, 6);
        this.ctx.fillRect(player.x + 18, player.y + 12, 6, 6);
        
        // 瞳孔
        this.ctx.fillStyle = player.type === 'player' ? '#333' : 'rgba(51, 51, 51, 0.8)';
        this.ctx.fillRect(player.x + 10 + player.direction, player.y + 14, 2, 2);
        this.ctx.fillRect(player.x + 20 + player.direction, player.y + 14, 2, 2);
        
        this.ctx.restore();
    }
    
    renderEnemies() {
        this.enemies.forEach(enemy => {
            // 根据类型设置颜色
            if (enemy.type === 'normal') {
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
            
            // 标记
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(enemy.type === 'normal' ? 'N' : 'S', 
                            enemy.x + enemy.width/2, enemy.y + enemy.height/2 + 4);
        });
    }
    
    renderBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.shooter === 'player' ? '#FFD700' : 'rgba(255, 215, 0, 0.8)';
            this.ctx.fillRect(bullet.x - 3, bullet.y - 3, 6, 6);
        });
    }
    
    renderGameUI() {
        // 游戏内UI
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 60);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`分数: ${this.score}`, 20, 30);
        this.ctx.fillText(`敌人: ${this.enemies.length}`, 20, 50);
        
        if (this.shadow) {
            this.ctx.fillStyle = '#8A2BE2';
            this.ctx.fillText('分身激活', 150, 30);
        }
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