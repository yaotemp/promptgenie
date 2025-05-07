import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PromptEditor from './components/PromptEditor';
import TagManager from './components/TagManager'; // 导入标签管理组件
import Settings from './components/Settings'; // 导入设置组件
import ConfirmDialog from './components/ConfirmDialog'; // 导入自定义对话框
import { initDatabase, getAllPrompts, createPrompt, updatePrompt, toggleFavorite, deletePrompt, Prompt, PromptInput, updateTrayMenu, copyPromptToClipboard, getPrompt, updatePromptLastUsed } from './services/db';

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false); // 添加标签管理状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 添加设置状态
  const [searchTerm, setSearchTerm] = useState(''); // 添加搜索词状态

  // 当前过滤模式
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // 过滤后的提示词
  const filteredPrompts = React.useMemo(() => {
    let result = [...prompts];

    // 收藏过滤
    if (filterMode === 'favorites') {
      result = result.filter(prompt => prompt.isFavorite);
    }

    // 标签过滤
    if (selectedTagId) {
      result = result.filter(prompt =>
        prompt.tags.some(tag => tag.id === selectedTagId)
      );
    }

    // 搜索过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(prompt =>
        prompt.title.toLowerCase().includes(term) ||
        prompt.content.toLowerCase().includes(term) ||
        prompt.tags.some(tag => tag.name.toLowerCase().includes(term))
      );
    }

    return result;
  }, [prompts, filterMode, selectedTagId, searchTerm]);

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

        // 启动时更新托盘菜单
        updateTrayMenu().catch(err => {
          console.error('启动时更新托盘菜单失败:', err);
        });

        // 监听托盘菜单中提示词被选择的事件
        const { listen } = await import('@tauri-apps/api/event');
        // 监听常规复制事件
        const unlistenTrayPrompt = await listen('tray-prompt-selected', (event) => {
          const promptId = event.payload as string;
          console.log(`托盘菜单选择了提示词: ${promptId}`);
          copyPromptToClipboard(promptId)
            .then(success => {
              if (success) {
                console.log('已通过托盘菜单复制提示词');
              } else {
                console.error('通过托盘菜单复制提示词失败');
              }
            })
            .catch(err => {
              console.error('处理托盘菜单选择事件时出错:', err);
            });
        });

        // 监听直接粘贴到输入框的事件
        const unlistenPastePrompt = await listen('paste-prompt-content', async (event) => {
          const promptId = event.payload as string;
          console.log(`准备将提示词直接插入到输入框: ${promptId}`);

          try {
            // 1. 获取提示词内容
            const prompt = await getPrompt(promptId);
            if (!prompt) {
              console.error(`找不到ID为${promptId}的提示词`);
              return;
            }

            // 2. 将内容复制到剪贴板
            const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
            await writeText(prompt.content);
            console.log(`提示词 "${prompt.title}" 已复制到剪贴板`);

            // 3. 检查是否启用了自动插入功能
            const trayAutoInsert = localStorage.getItem('trayAutoInsert') !== 'false'; // 默认为 true

            if (trayAutoInsert) {
              // 模拟粘贴操作
              const { invoke } = await import('@tauri-apps/api/core');
              await invoke('simulate_paste');
              console.log('已触发粘贴操作');
            } else {
              console.log('自动插入功能已禁用，仅复制到剪贴板');
            }

            // 4. 更新最后使用时间
            await updatePromptLastUsed(promptId);
          } catch (err) {
            console.error('粘贴提示词内容时出错:', err);
          }
        });

        // 组件卸载时移除事件监听
        return () => {
          unlistenTrayPrompt();
          unlistenPastePrompt();
        };
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

  // 添加标签状态变化事件处理
  const handleTagsChanged = async () => {
    // 当标签被修改或删除后重新加载提示词列表，确保标签变更反映到UI上
    try {
      setIsLoading(true);
      const loadedPrompts = await getAllPrompts();
      setPrompts(loadedPrompts);
    } catch (err) {
      console.error('刷新提示词列表失败:', err);
      setError('刷新数据失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开标签管理器
  const openTagManager = () => {
    setIsTagManagerOpen(true);
  };

  // 关闭标签管理器
  const closeTagManager = async () => {
    setIsTagManagerOpen(false);
    // 关闭标签管理器后刷新数据
    await handleTagsChanged();
  };

  // 打开设置
  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  // 关闭设置
  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  // 处理侧边栏收藏项点击
  const handleFavoritesClick = () => {
    setFilterMode('favorites');
    setSelectedTagId(null);
  };

  // 处理"所有提示词"点击
  const handleAllPromptsClick = () => {
    setFilterMode('all');
    setSelectedTagId(null);
  };

  // 处理标签点击
  const handleTagClick = (tagId: string) => {
    setSelectedTagId(tagId);
    setFilterMode('all'); // 重置收藏过滤以避免混淆
  };

  // 处理搜索输入变化
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // 获取当前视图的标题
  const getContentTitle = () => {
    let baseTitle = '';

    // 确定基础标题（根据过滤条件）
    if (selectedTagId) {
      const tag = prompts
        .flatMap(p => p.tags)
        .find(t => t.id === selectedTagId);
      baseTitle = tag ? `标签: ${tag.name}` : '已过滤提示词';
    } else {
      baseTitle = filterMode === 'favorites' ? '收藏提示词' : '所有提示词';
    }

    // 如果有搜索词，追加搜索信息
    if (searchTerm.trim()) {
      return `${baseTitle} (搜索: "${searchTerm}")`;
    }

    return baseTitle;
  };

  return (
    <>
      {/* 标题栏与内容之间的分割线 */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-gray-200 z-10"></div>
      <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
        <Sidebar
          onNewPrompt={() => handleEditorOpen()}
          onOpenTagManager={openTagManager}
          onAllPromptsClick={handleAllPromptsClick}
          onFavoritesClick={handleFavoritesClick}
          onTagClick={handleTagClick}
          activeFilterMode={filterMode}
          activeTagId={selectedTagId}
          onOpenSettings={openSettings}
        />

        <MainContent
          title={getContentTitle()}
          prompts={filteredPrompts}
          isLoading={isLoading}
          onFavoriteToggle={handleFavoriteToggle}
          onEdit={handleEditorOpen}
          onDelete={handleDeletePrompt}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
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

        {/* 浮动操作按钮区 */}
        <div className="fixed right-8 bottom-8 flex flex-col space-y-3 items-end">
          {/* 添加提示词按钮 */}
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

        {/* 标签管理模态框 */}
        <TagManager
          isOpen={isTagManagerOpen}
          onClose={closeTagManager}
        />

        {/* 设置模态框 */}
        <Settings
          isOpen={isSettingsOpen}
          onClose={closeSettings}
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
    </>
  );
}

export default App;