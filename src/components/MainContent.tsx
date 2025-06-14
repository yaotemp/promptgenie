import React, { useState } from 'react';
import Header from './Header';
import PromptGrid from './PromptGrid';
import PromptList from './PromptList';
import { Prompt, updatePromptLastUsed } from '../services/db';

type MainContentProps = {
  title: string;
  prompts: Prompt[];
  isLoading: boolean;
  onFavoriteToggle: (promptGroupId: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptGroupId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onHistory: (promptGroupId: string) => void;
};

const MainContent: React.FC<MainContentProps> = ({
  title,
  prompts,
  isLoading,
  onFavoriteToggle,
  onEdit,
  onDelete,
  searchTerm,
  onSearchChange,
  onHistory
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCopy = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      navigator.clipboard.writeText(prompt.content)
        .then(() => {
          console.log('提示词已复制到剪贴板');
          updatePromptLastUsed(id).catch(err => {
            console.error(`更新提示词 ${id} 的 last_used_at 失败:`, err);
          });
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={title}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
      <div className="flex-1 overflow-y-auto bg-gray-50 hide-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : prompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <p className="text-lg">没有提示词</p>
            <p className="text-sm mt-1">点击右下角的按钮添加一个提示词</p>
          </div>
        ) : viewMode === 'grid' ? (
          <PromptGrid
            prompts={prompts}
            onFavoriteToggle={onFavoriteToggle}
            onCopy={handleCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            onHistory={onHistory}
          />
        ) : (
          <PromptList
            prompts={prompts}
            onFavoriteToggle={onFavoriteToggle}
            onCopy={handleCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            onHistory={onHistory}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;