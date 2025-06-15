// 设置服务：管理应用设置的持久化和默认值

export interface AppSettings {
  autoExportOnExit: boolean;
  trayAutoInsert: boolean;
  exportPath?: string;
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  autoExportOnExit: true,
  trayAutoInsert: true,
};

// 设置键名
const SETTINGS_KEYS = {
  AUTO_EXPORT_ON_EXIT: 'autoExportOnExit',
  TRAY_AUTO_INSERT: 'trayAutoInsert',
  EXPORT_PATH: 'exportPath',
} as const;

// 获取设置值
export function getSetting<K extends keyof AppSettings>(
  key: K
): AppSettings[K] {
  try {
    const value = localStorage.getItem(SETTINGS_KEYS[key as keyof typeof SETTINGS_KEYS]);
    
    if (value === null) {
      return DEFAULT_SETTINGS[key];
    }

    // 处理布尔值
    if (typeof DEFAULT_SETTINGS[key] === 'boolean') {
      return (value === 'true') as AppSettings[K];
    }

    // 处理字符串值
    return value as AppSettings[K];
  } catch (error) {
    console.error(`获取设置 ${key} 失败:`, error);
    return DEFAULT_SETTINGS[key];
  }
}

// 设置值
export function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  try {
    const settingKey = SETTINGS_KEYS[key as keyof typeof SETTINGS_KEYS];
    localStorage.setItem(settingKey, String(value));
  } catch (error) {
    console.error(`设置 ${key} 失败:`, error);
  }
}

// 获取所有设置
export function getAllSettings(): AppSettings {
  return {
    autoExportOnExit: getSetting('autoExportOnExit'),
    trayAutoInsert: getSetting('trayAutoInsert'),
    exportPath: getSetting('exportPath'),
  };
}

// 批量设置
export function setSettings(settings: Partial<AppSettings>): void {
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined) {
      setSetting(key as keyof AppSettings, value);
    }
  });
}

// 重置为默认设置
export function resetSettings(): void {
  try {
    Object.keys(SETTINGS_KEYS).forEach(key => {
      localStorage.removeItem(SETTINGS_KEYS[key as keyof typeof SETTINGS_KEYS]);
    });
  } catch (error) {
    console.error('重置设置失败:', error);
  }
}

// 检查设置是否启用
export function isAutoExportEnabled(): boolean {
  return getSetting('autoExportOnExit');
}

export function isTrayAutoInsertEnabled(): boolean {
  return getSetting('trayAutoInsert');
}

// 导出设置检查
export function shouldExportOnExit(): boolean {
  return isAutoExportEnabled();
} 