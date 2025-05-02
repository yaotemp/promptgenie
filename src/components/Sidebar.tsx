import React from 'react';
import { FolderIcon, PlusCircleIcon, StarIcon, TagIcon, SettingsIcon, SearchIcon } from 'lucide-react';

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  count?: number;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, count }) => {
  return (
    <li className={`flex items-center px-3 py-2 rounded-lg mb-1 cursor-pointer group transition-all duration-150 ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
      <div className="flex items-center flex-1">
        <span className={`mr-2 ${active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-xs px-2 py-1 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {count}
        </span>
      )}
    </li>
  );
};

const Sidebar: React.FC = () => {
  return (
    <div className="w-60 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-800">提示词精灵</h1>
        </div>
        
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <SearchIcon size={16} />
          </span>
          <input 
            type="text" 
            placeholder="搜索提示词..." 
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
        </div>
        
        <div className="mb-6">
          <button className="w-full flex items-center justify-center py-2 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-150 shadow-sm">
            <PlusCircleIcon size={18} className="mr-2" />
            <span className="text-sm font-medium">新建提示词</span>
          </button>
        </div>
      </div>
      
      <nav className="flex-1 px-2 overflow-y-auto">
        <ul>
          <SidebarItem icon={<FolderIcon size={18} />} label="所有提示词" active count={128} />
          <SidebarItem icon={<StarIcon size={18} />} label="收藏提示词" count={24} />
          <SidebarItem icon={<TagIcon size={18} />} label="标签管理" />
        </ul>
        
        <div className="mt-6 mb-3 px-3">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">分类</h3>
        </div>
        
        <ul>
          <SidebarItem icon={<FolderIcon size={18} />} label="文案创作" count={45} />
          <SidebarItem icon={<FolderIcon size={18} />} label="代码编程" count={32} />
          <SidebarItem icon={<FolderIcon size={18} />} label="设计创作" count={23} />
          <SidebarItem icon={<FolderIcon size={18} />} label="数据分析" count={15} />
          <SidebarItem icon={<FolderIcon size={18} />} label="其他" count={13} />
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-150">
          <SettingsIcon size={18} className="mr-2" />
          <span className="text-sm">设置</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;