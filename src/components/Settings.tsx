import React, { useState, useEffect } from 'react';
import { XIcon, Download, FileCheck } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { exportDatabaseToFile } from '../services/db';

// 定义组件Props
interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [trayAutoInsert, setTrayAutoInsert] = useState<boolean>(true);
  const [accessibilityStatus, setAccessibilityStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  // 新增：导出设置状态
  const [autoExportOnExit, setAutoExportOnExit] = useState<boolean>(true);
  const [isManualExporting, setIsManualExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // 从 localStorage 加载设置
        const savedSetting = localStorage.getItem('trayAutoInsert');
        setTrayAutoInsert(savedSetting !== 'false'); // 默认为 true
        
        // 加载导出设置
        const savedExportSetting = localStorage.getItem('autoExportOnExit');
        setAutoExportOnExit(savedExportSetting !== 'false'); // 默认为 true

        // 检查系统权限状态
        try {
          const isGranted = await invoke<boolean>('check_accessibility_permission');
          setAccessibilityStatus(isGranted ? 'granted' : 'denied');
        } catch (err) {
          console.error('检查权限状态失败:', err);
          setAccessibilityStatus('unknown');
        }
      } catch (err) {
        console.error('加载设置失败:', err);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // 保存设置
  const saveSettings = async () => {
    try {
      localStorage.setItem('trayAutoInsert', trayAutoInsert.toString());
      localStorage.setItem('autoExportOnExit', autoExportOnExit.toString());
      // 如果启用了功能但没有权限，提示用户
      if (trayAutoInsert && accessibilityStatus === 'denied') {
        openAccessibilitySettings();
      }
      onClose();
    } catch (err) {
      console.error('保存设置失败:', err);
    }
  };

  // 打开系统辅助功能设置
  const openAccessibilitySettings = async () => {
    try {
      await invoke('open_accessibility_settings');
    } catch (err) {
      console.error('打开系统设置失败:', err);
      // 回退方案：显示说明
      alert('请打开系统偏好设置 > 安全性与隐私 > 隐私 > 辅助功能，并为PromptGenie启用权限');
    }
  };

  // 手动导出数据库
  const handleManualExport = async () => {
    if (isManualExporting) return;
    
    setIsManualExporting(true);
    setExportMessage('正在导出数据库...');
    
    try {
      const exportedPath = await exportDatabaseToFile();
      if (exportedPath) {
        setExportMessage(`导出成功！文件保存至：${exportedPath}`);
      } else {
        setExportMessage('导出失败，请重试');
      }
    } catch (error) {
      console.error('手动导出失败:', error);
      setExportMessage('导出出错，请重试');
    } finally {
      setIsManualExporting(false);
      // 3秒后清除消息
      setTimeout(() => setExportMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">设置</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="关闭"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">托盘菜单设置</h3>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-gray-800">自动插入提示词</p>
                <p className="text-sm text-gray-500">
                  从托盘菜单选择提示词时，自动插入到当前活动的输入框
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={trayAutoInsert}
                  onChange={(e) => setTrayAutoInsert(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {trayAutoInsert && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-700 mb-2">
                  此功能需要系统辅助功能权限才能模拟键盘输入。
                </p>

                {accessibilityStatus === 'denied' && (
                  <button
                    onClick={openAccessibilitySettings}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                  >
                    打开系统权限设置
                  </button>
                )}

                {accessibilityStatus === 'granted' && (
                  <p className="text-sm text-green-600">
                    已获得辅助功能权限，自动插入功能可正常工作。
                  </p>
                )}

                {accessibilityStatus === 'unknown' && (
                  <p className="text-sm text-yellow-600">
                    无法检查权限状态，功能可能无法正常工作。
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-2">数据导出设置</h3>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-gray-800">退出时自动导出</p>
                <p className="text-sm text-gray-500">
                  应用退出时自动导出数据库到JSON文件
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExportOnExit}
                  onChange={(e) => setAutoExportOnExit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="mt-3">
              <button
                onClick={handleManualExport}
                disabled={isManualExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isManualExporting ? (
                  <Download className="w-4 h-4 animate-pulse" />
                ) : (
                  <FileCheck className="w-4 h-4" />
                )}
                <span>{isManualExporting ? '导出中...' : '立即导出'}</span>
              </button>
              
              {exportMessage && (
                <div className={`mt-2 p-2 rounded-lg text-sm ${
                  exportMessage.includes('成功') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : exportMessage.includes('失败') || exportMessage.includes('出错')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {exportMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mr-2"
          >
            取消
          </button>
          <button
            onClick={saveSettings}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 