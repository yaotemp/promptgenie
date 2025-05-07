import React from 'react';
import { SearchIcon, SlidersIcon, GridIcon, ListIcon } from 'lucide-react';

type HeaderProps = {
  title: string;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
};

const Header: React.FC<HeaderProps> = ({ title, viewMode, onViewModeChange }) => {
  return (
    <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-white">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center space-x-4">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            placeholder="在当前视图中搜索..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
        </div>

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
  );
};

export default Header;