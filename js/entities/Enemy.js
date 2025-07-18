// 敌人实体类
export class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.vx = 0;
        this.vy = 0;
        this.type = type; // 'normal', 'shadow', 'boss'
        this.onGround = false;
        this.health = type === 'boss' ? 3 : 1;
        this.maxHealth = this.health;
        this.direction = 1;
        this.patrolDistance = 100;
        this.startX = x;
        this.animFrame = 0;
        this.shootCooldown = 0;
        this.aggroRange = 150;
        this.isAggro = false;
    }
    
    update(playerX, playerY, shadowX = null, shadowY = null) {
        this.animFrame += 0.1;
        
        // 检测玩家距离
        const distToPlayer = Math.sqrt((this.x - playerX) ** 2 + (this.y - playerY) ** 2);
        const distToShadow = shadowX ? Math.sqrt((this.x - shadowX) ** 2 + (this.y - shadowY) ** 2) : Infinity;
        
        this.isAggro = distToPlayer < this.aggroRange || distToShadow < this.aggroRange;
        
        if (this.isAggro) {
            // 追击模式
            const targetX = distToPlayer < distToShadow ? playerX : shadowX;
            if (targetX < this.x) {
                this.vx = -2;
                this.direction = -1;
            } else {
                this.vx = 2;
                this.direction = 1;
            }
        } else {
            // 巡逻模式
            const distFromStart = this.x - this.startX;
            if (Math.abs(distFromStart) > this.patrolDistance) {
                this.direction *= -1;
            }
            this.vx = this.direction * 1;
        }
        
        // 射击冷却
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }
    
    canShoot() {
        return this.shootCooldown <= 0 && this.isAggro;
    }
    
    shoot() {
        if (this.canShoot()) {
            this.shootCooldown = 60; // 1秒冷却
            return {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: this.direction * 5,
                vy: 0,
                shooter: 'enemy',
                type: this.type
            };
        }
        return null;
    }
    
    takeDamage(shooter) {
        // 检查是否可以被该射手伤害
        const canBeDamaged = (this.type === 'normal' && shooter === 'player') ||
                            (this.type === 'shadow' && shooter === 'shadow') ||
                            (this.type === 'boss'); // boss可以被任何人伤害
        
        if (canBeDamaged) {
            this.health--;
            return this.health <= 0;
        }
        return false;
    }
    
    render(ctx) {
        ctx.save();
        
        // 阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 2;
        
        // 根据类型设置颜色
        let gradient;
        switch (this.type) {
            case 'normal':
                gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, '#FF6B6B');
                gradient.addColorStop(1, '#E74C3C');
                break;
            case 'shadow':
                gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, '#9B59B6');
                gradient.addColorStop(1, '#8E44AD');
                break;
            case 'boss':
                gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
                gradient.addColorStop(0, '#F39C12');
                gradient.addColorStop(1, '#E67E22');
                break;
        }
        
        ctx.fillStyle = gradient;
        
        // 身体动画
        const bounce = Math.sin(this.animFrame) * 2;
        ctx.fillRect(this.x, this.y + bounce, this.width, this.height);
        
        // 眼睛
        ctx.fillStyle = this.isAggro ? '#FF0000' : '#FFFFFF';
        ctx.fillRect(this.x + 6, this.y + 8 + bounce, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8 + bounce, 4, 4);
        
        // 类型标记
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const label = this.type === 'normal' ? 'N' : this.type === 'shadow' ? 'S' : 'B';
        ctx.fillText(label, this.x + this.width/2, this.y + this.height/2 + 4 + bounce);
        
        // 健康条（多血量敌人）
        if (this.maxHealth > 1) {
            const barWidth = this.width;
            const barHeight = 3;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(this.x, this.y - 6, barWidth, barHeight);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.fillRect(this.x, this.y - 6, barWidth * (this.health / this.maxHealth), barHeight);
        }
        
        // 攻击状态指示
        if (this.isAggro) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 2, this.y - 2 + bounce, this.width + 4, this.height + 4);
        }
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}