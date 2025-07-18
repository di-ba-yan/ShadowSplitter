// 玩家实体类
export class Player {
    constructor(x, y, type = 'player') {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.vx = 0;
        this.vy = 0;
        this.type = type; // 'player' 或 'shadow'
        this.direction = 1;
        this.onGround = false;
        this.shooting = false;
        this.health = 100;
        this.maxSpeed = 6;
        this.jumpPower = 15;
        this.shootCooldown = 0;
        
        // 动画相关
        this.animFrame = 0;
        this.animSpeed = 0.2;
        this.isMoving = false;
        this.isJumping = false;
    }
    
    update() {
        // 更新动画
        if (this.isMoving) {
            this.animFrame += this.animSpeed;
        } else {
            this.animFrame = 0;
        }
        
        // 更新射击冷却
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        // 检查是否在移动
        this.isMoving = Math.abs(this.vx) > 0.1;
        this.isJumping = !this.onGround;
    }
    
    move(direction) {
        const acceleration = 0.8;
        this.vx += direction * acceleration;
        this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
        this.direction = direction;
    }
    
    jump() {
        if (this.onGround) {
            this.vy = -this.jumpPower;
            this.onGround = false;
            return true; // 成功跳跃
        }
        return false;
    }
    
    shoot() {
        if (this.shootCooldown <= 0) {
            this.shootCooldown = 20; // 冷却时间
            return {
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: this.direction * 10,
                vy: 0,
                shooter: this.type
            };
        }
        return null;
    }
    
    render(ctx) {
        ctx.save();
        
        // 阴影效果
        if (this.type === 'player') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetY = 3;
        }
        
        // 主体颜色
        if (this.type === 'player') {
            // 渐变蓝色本体
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#4A90E2');
            gradient.addColorStop(1, '#2E5BBA');
            ctx.fillStyle = gradient;
        } else {
            // 半透明紫色分身
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
            gradient.addColorStop(1, 'rgba(75, 0, 130, 0.8)');
            ctx.fillStyle = gradient;
        }
        
        // 绘制身体（带动画效果）
        const bodyOffset = this.isMoving ? Math.sin(this.animFrame) * 2 : 0;
        ctx.fillRect(this.x, this.y + bodyOffset, this.width, this.height);
        
        // 绘制眼睛
        ctx.fillStyle = this.type === 'player' ? 'white' : 'rgba(255, 255, 255, 0.8)';
        const eyeY = this.y + 12 + bodyOffset;
        ctx.fillRect(this.x + 8, eyeY, 6, 6);
        ctx.fillRect(this.x + 18, eyeY, 6, 6);
        
        // 瞳孔
        ctx.fillStyle = this.type === 'player' ? '#333' : 'rgba(51, 51, 51, 0.8)';
        ctx.fillRect(this.x + 10 + this.direction, eyeY + 2, 2, 2);
        ctx.fillRect(this.x + 20 + this.direction, eyeY + 2, 2, 2);
        
        // 武器指示
        if (this.shootCooldown > 0) {
            ctx.fillStyle = this.type === 'player' ? '#FFD700' : 'rgba(255, 215, 0, 0.8)';
            const weaponX = this.direction > 0 ? this.x + this.width : this.x - 8;
            ctx.fillRect(weaponX, this.y + this.height/2 - 2, 8, 4);
        }
        
        // 健康条
        if (this.health < 100) {
            const barWidth = this.width;
            const barHeight = 4;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.fillRect(this.x, this.y - 8, barWidth * (this.health / 100), barHeight);
        }
        
        ctx.restore();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
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