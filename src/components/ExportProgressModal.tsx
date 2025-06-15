import React from 'react';
import { X, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  message: string | null;
  onCancel?: () => void;
}

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  onClose,
  isExporting,
  message,
  onCancel
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (isExporting) {
      return <Download className="w-6 h-6 text-blue-500 animate-pulse" />;
    } else if (message?.includes('完成')) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (message?.includes('失败') || message?.includes('出错')) {
      return <AlertCircle className="w-6 h-6 text-red-500" />;
    }
    return <Download className="w-6 h-6 text-gray-500" />;
  };

  const getMessageColor = () => {
    if (message?.includes('完成')) {
      return 'text-green-600';
    } else if (message?.includes('失败') || message?.includes('出错')) {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            数据库导出
          </h3>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center">
            {getIcon()}
          </div>

          {message && (
            <p className={`text-center ${getMessageColor()}`}>
              {message}
            </p>
          )}

          {isExporting && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            {isExporting && onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            )}
            
            {!isExporting && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                确定
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportProgressModal; 