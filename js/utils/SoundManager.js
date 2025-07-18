// 音效管理器
export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.initSounds();
    }
    
    initSounds() {
        // 使用Web Audio API创建简单音效
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 预定义音效参数
        this.soundConfigs = {
            jump: { frequency: 440, duration: 0.1, type: 'sine' },
            shoot: { frequency: 800, duration: 0.05, type: 'square' },
            hit: { frequency: 200, duration: 0.1, type: 'sawtooth' },
            enemyDeath: { frequency: 150, duration: 0.3, type: 'triangle' },
            collect: { frequency: 660, duration: 0.2, type: 'sine' },
            shadowCreate: { frequency: 330, duration: 0.2, type: 'sine' },
            shadowDestroy: { frequency: 220, duration: 0.15, type: 'sine' },
            levelComplete: { frequency: 523, duration: 0.5, type: 'sine' }
        };
    }
    
    playSound(name) {
        if (!this.enabled || !this.soundConfigs[name]) return;
        
        try {
            const config = this.soundConfigs[name];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
            oscillator.type = config.type;
            
            gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + config.duration);
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}