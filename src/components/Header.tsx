import React, { useState } from 'react';
import { SearchIcon, GridIcon, ListIcon, Download, Upload } from 'lucide-react';
import ExportImportModal from './ExportImportModal';

type HeaderProps = {
  title: string;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onDataChange?: () => void;
};

const Header: React.FC<HeaderProps> = ({ 
  title, 
  viewMode, 
  onViewModeChange, 
  searchTerm, 
  onSearchChange,
  onDataChange 
}) => {
  const [showExportImportModal, setShowExportImportModal] = useState(false);

  const handleImportSuccess = () => {
    if (onDataChange) {
      onDataChange();
    }
  };

  return (
    <>
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <h1 className="text-xl font-semibold text-gray-800 truncate whitespace-nowrap max-w-[30%]" title={title}>{title}</h1>

        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="在当前视图中搜索..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
            />
          </div>

          {/* 导出导入按钮 */}
          <button
            onClick={() => setShowExportImportModal(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="导出/导入数据"
          >
            <Download className="w-4 h-4 mr-1" />
            <Upload className="w-4 h-4" />
          </button>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              onClick={() => onViewModeChange('grid')}
            >
              <GridIcon size={18} />
            </button>
            <button
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              onClick={() => onViewModeChange('list')}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 导出导入模态框 */}
      <ExportImportModal
        isOpen={showExportImportModal}
        onClose={() => setShowExportImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </>
  );
};

export default Header;