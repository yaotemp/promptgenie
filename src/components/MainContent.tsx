import React, { useState } from 'react';
import Header from './Header';
import PromptGrid from './PromptGrid';
import PromptList from './PromptList';
import { Prompt } from '../services/db';

type MainContentProps = {
  title: string;
  prompts: Prompt[];
  isLoading: boolean;
  onFavoriteToggle: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
};

const MainContent: React.FC<MainContentProps> = ({
  title,
  prompts,
  isLoading,
  onFavoriteToggle,
  onEdit,
  onDelete
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleCopy = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      navigator.clipboard.writeText(prompt.content)
        .then(() => {
          // 可以在这里增加一个复制成功的提示
          console.log('提示词已复制到剪贴板');
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
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          />
        ) : (
          <PromptList
            prompts={prompts}
            onFavoriteToggle={onFavoriteToggle}
            onCopy={handleCopy}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;