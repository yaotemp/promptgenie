import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PromptEditor from './components/PromptEditor';
import { initDatabase, getAllPrompts, createPrompt, updatePrompt, toggleFavorite, deletePrompt, Prompt, PromptInput } from './services/db';

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 可用标签数据
  const availableTags = [
    { id: '1', name: '营销', color: '#3B82F6' },
    { id: '2', name: '专业', color: '#10B981' },
    { id: '3', name: 'React', color: '#8B5CF6' },
    { id: '4', name: 'TypeScript', color: '#EC4899' },
    { id: '5', name: 'UI设计', color: '#F59E0B' },
    { id: '6', name: '规范', color: '#6366F1' },
    { id: '7', name: '数据', color: '#EF4444' },
    { id: '8', name: '报告', color: '#14B8A6' },
    { id: '9', name: '电商', color: '#9333EA' },
    { id: '10', name: 'AI绘画', color: '#8B5CF6' },
    { id: '11', name: '创意', color: '#F97316' }
  ];

  // 初始化数据库并加载提示词
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await initDatabase();
        const loadedPrompts = await getAllPrompts();
        setPrompts(loadedPrompts);
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('无法加载数据，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEditorOpen = (prompt?: Prompt) => {
    setEditingPrompt(prompt || null);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingPrompt(null);
  };

  const handleSavePrompt = async (promptData: PromptInput) => {
    try {
      if (editingPrompt) {
        // 更新现有提示词
        const updatedPrompt = await updatePrompt(editingPrompt.id, promptData);
        setPrompts(prevPrompts =>
          prevPrompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p)
        );
      } else {
        // 创建新提示词
        const newPrompt = await createPrompt(promptData);
        setPrompts(prevPrompts => [newPrompt, ...prevPrompts]);
      }

      setIsEditorOpen(false);
      setEditingPrompt(null);
    } catch (err) {
      console.error('保存提示词失败:', err);
      setError('保存提示词失败，请重试');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await deletePrompt(id);
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== id));
    } catch (err) {
      console.error('删除提示词失败:', err);
      setError('删除提示词失败，请重试');
    }
  };

  const handleFavoriteToggle = async (id: string) => {
    try {
      const isFavorite = await toggleFavorite(id);
      setPrompts(prevPrompts =>
        prevPrompts.map(p => p.id === id ? { ...p, isFavorite } : p)
      );
    } catch (err) {
      console.error('切换收藏状态失败:', err);
      setError('操作失败，请重试');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <MainContent
        title="所有提示词"
        prompts={prompts}
        isLoading={isLoading}
        onFavoriteToggle={handleFavoriteToggle}
        onEdit={handleEditorOpen}
        onDelete={handleDeletePrompt}
      />

      {/* 错误消息 */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <span>{error}</span>
          <button
            className="ml-4 text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
          >
            关闭
          </button>
        </div>
      )}

      {/* 浮动添加按钮 */}
      <div className="fixed right-8 bottom-8">
        <button
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          onClick={() => handleEditorOpen()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* 提示词编辑器模态框 */}
      <PromptEditor
        isOpen={isEditorOpen}
        initialData={editingPrompt ? {
          id: editingPrompt.id,
          title: editingPrompt.title,
          content: editingPrompt.content,
          tags: editingPrompt.tags
        } : {
          title: '',
          content: '',
          tags: []
        }}
        availableTags={availableTags}
        onClose={handleEditorClose}
        onSave={handleSavePrompt}
      />
    </div>
  );
}

export default App;