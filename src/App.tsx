import React, { useState, useEffect } from 'react';
// import { confirm } from '@tauri-apps/plugin-dialog'; // 不再需要 Tauri 对话框
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PromptEditor from './components/PromptEditor';
import ConfirmDialog from './components/ConfirmDialog'; // 导入自定义对话框
import { initDatabase, getAllPrompts, createPrompt, updatePrompt, toggleFavorite, deletePrompt, Prompt, PromptInput } from './services/db';

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 确认对话框状态
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [promptToDeleteId, setPromptToDeleteId] = useState<string | null>(null);

  // 初始化数据库并加载提示词
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null); // 清除旧错误
        console.log('App: Initializing database...');
        await initDatabase(); // 等待初始化完成
        console.log('App: Database initialized. Loading prompts...');
        const loadedPrompts = await getAllPrompts();
        setPrompts(loadedPrompts);
        console.log('App: Prompts loaded.');
      } catch (err) {
        console.error('App: 加载数据失败:', err);
        setError('无法加载数据，请检查数据库连接或重启应用。');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // 空依赖数组，确保只运行一次

  const handleEditorOpen = (prompt?: Prompt) => {
    setEditingPrompt(prompt || null);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingPrompt(null);
  };

  const handleSavePrompt = async (promptData: PromptInput) => {
    setError(null); // 清除旧错误
    try {
      if (editingPrompt) {
        const updatedPrompt = await updatePrompt(editingPrompt.id, promptData);
        setPrompts(prevPrompts =>
          prevPrompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p)
        );
      } else {
        const newPrompt = await createPrompt(promptData);
        setPrompts(prevPrompts => [newPrompt, ...prevPrompts]);
      }
      setIsEditorOpen(false);
      setEditingPrompt(null);
    } catch (err) {
      console.error('保存提示词失败:', err);
      setError('保存提示词失败，请重试。');
    }
  };

  // 打开删除确认对话框
  const handleDeletePrompt = async (id: string) => {
    setPromptToDeleteId(id); // 设置要删除的 ID
    setIsConfirmOpen(true); // 打开确认对话框
  };

  // 确认删除操作
  const confirmDeletion = async () => {
    if (!promptToDeleteId) return;
    setError(null);
    try {
      await deletePrompt(promptToDeleteId);
      setPrompts(prevPrompts => prevPrompts.filter(p => p.id !== promptToDeleteId));
    } catch (err) {
      console.error('删除提示词失败:', err);
      setError('删除提示词失败，请重试。');
    } finally {
      setIsConfirmOpen(false); // 关闭对话框
      setPromptToDeleteId(null); // 清空 ID
    }
  };

  // 取消删除操作
  const cancelDeletion = () => {
    setIsConfirmOpen(false); // 关闭对话框
    setPromptToDeleteId(null); // 清空 ID
  };

  const handleFavoriteToggle = async (id: string) => {
    setError(null);
    try {
      const isFavorite = await toggleFavorite(id);
      setPrompts(prevPrompts =>
        prevPrompts.map(p => p.id === id ? { ...p, isFavorite } : p)
      );
    } catch (err) {
      console.error('切换收藏状态失败:', err);
      setError('操作失败，请重试。');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <Sidebar
        onNewPrompt={() => handleEditorOpen()}
      />

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
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg z-50 shadow-md">
          <span>{error}</span>
          <button
            className="ml-4 text-red-500 hover:text-red-700 font-semibold"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* 浮动添加按钮 */}
      <div className="fixed right-8 bottom-8">
        <button
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          onClick={() => handleEditorOpen()}
          aria-label="创建新提示词"
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
        onClose={handleEditorClose}
        onSave={handleSavePrompt}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="确认删除"
        message="确定要删除这个提示词吗？此操作无法撤销。"
        confirmText="删除"
        onConfirm={confirmDeletion}
        onCancel={cancelDeletion}
      />
    </div>
  );
}

export default App;