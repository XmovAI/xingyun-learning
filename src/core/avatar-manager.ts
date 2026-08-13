// ============================================
// Avatar Manager — SDK Lifecycle
// ============================================

import { store } from '../state/app-state';

class AvatarManager {
  private avatar: any = null;
  private connected = false;

  isConnected(): boolean {
    return this.connected;
  }

  getAvatar(): any {
    return this.avatar;
  }

  setAvatar(instance: any): void {
    this.avatar = instance;
    // Only update avatar in store, don't touch sdkConnected
    // sdkConnected is managed exclusively by init()/destroy()
    store.set({ avatar: instance });
    store.log('info', '实例已注册');
  }

  setConnected(val: boolean): void {
    this.connected = val;
  }

  clearAvatar(): void {
    this.avatar = null;
    this.connected = false;
  }

  async init(onDownloadProgress?: (progress: number) => void): Promise<void> {
    if (!this.avatar) {
      store.log('error', '请先创建实例');
      throw new Error('No avatar instance');
    }

    store.log('info', '正在连接...');
    store.set({ sdkStatus: 'connecting' });

    try {
      await this.avatar.init({
        onDownloadProgress: (progress: number) => {
          store.log('log', `加载进度: ${progress}%`);
          onDownloadProgress?.(progress);
        },
      });

      this.connected = true;
      store.set({ sdkConnected: true, sdkStatus: 'online' });
      store.log('info', '连接成功！');
    } catch (err: any) {
      this.connected = false;
      store.set({ sdkConnected: false, sdkStatus: 'offline' });
      store.log('error', `连接失败: ${err.message || err}`);
      throw err;
    }
  }

  async destroy(reason: string = 'user_action'): Promise<void> {
    if (!this.avatar) return;

    try {
      await this.avatar.destroy(reason);
    } catch {}

    this.avatar = null;
    this.connected = false;
    store.set({ avatar: null, sdkConnected: false, sdkStatus: 'offline' });
    store.log('info', `实例已销毁 (${reason})`);
  }
}

export const avatarManager = new AvatarManager();
