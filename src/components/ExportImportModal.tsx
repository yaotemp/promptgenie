import { useState } from 'react';
import { Download, Upload, X, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { exportToFile, importFromFile } from '../services/fileService';
import { ImportOptions, ImportResult } from '../types/export';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function ExportImportModal({ isOpen, onClose, onImportSuccess }: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    mode: 'merge',
    includeVersionHistory: true,
    includeTags: true
  });

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const success = await exportToFile();
      if (success) {
        // 可以显示成功消息
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await importFromFile(importOptions);
      setImportResult(result);
      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        message: `导入失败: ${error instanceof Error ? error.message : String(error)}`,
        importedPrompts: 0,
        importedTags: 0,
        skippedPrompts: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">数据管理</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            导出数据
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            导入数据
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>导出所有提示词和标签数据到 JSON 文件。</p>
                <p className="mt-2">包含内容：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>所有提示词及其版本历史</li>
                  <li>所有标签信息</li>
                  <li>收藏状态和创建时间</li>
                </ul>
              </div>
              
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    导出数据
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>从 JSON 文件导入提示词和标签数据。</p>
              </div>

              {/* Import Options */}
              <div className="space-y-3">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Settings className="w-4 h-4 mr-2" />
                  导入选项
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm text-gray-600">
                    冲突处理方式：
                  </label>
                  <select
                    value={importOptions.mode}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, mode: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="merge">合并（推荐）</option>
                    <option value="overwrite">覆盖现有数据</option>
                    <option value="skip">跳过重复项</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.includeVersionHistory}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, includeVersionHistory: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">包含版本历史</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOptions.includeTags}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">包含标签信息</span>
                  </label>
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {importResult.message}
                    </span>
                  </div>
                  
                  {importResult.success && (
                    <div className="mt-2 text-xs text-green-700">
                      <p>导入了 {importResult.importedPrompts} 个提示词，{importResult.importedTags} 个标签</p>
                      {importResult.skippedPrompts > 0 && (
                        <p>跳过了 {importResult.skippedPrompts} 个重复项</p>
                      )}
                    </div>
                  )}
                  
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-700">
                      <p>错误信息：</p>
                      <ul className="list-disc list-inside">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    选择文件导入
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 