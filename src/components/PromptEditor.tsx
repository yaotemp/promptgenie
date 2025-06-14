import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { XIcon, TagIcon, PlusIcon } from 'lucide-react';
import { Tag, PromptInput } from '../services/db';

type PromptEditorProps = {
  isOpen: boolean;
  initialData?: {
    id?: string;
    title: string;
    content: string;
    sourceUrl?: string;
    tags: Tag[];
  };
  onClose: () => void;
  onSave: (promptData: PromptInput) => void;
};

const PromptEditor: React.FC<PromptEditorProps> = ({
  isOpen,
  initialData = { title: '', content: '', sourceUrl: '', tags: [] },
  onClose,
  onSave
}) => {
  const [promptData, setPromptData] = useState(initialData);
  const [newTagName, setNewTagName] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  // 预定义的颜色列表
  const colorOptions = [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#8B5CF6', // 紫色
    '#EC4899', // 粉色
    '#F59E0B', // 橙色
    '#6366F1', // 靛蓝色
    '#EF4444', // 红色
    '#14B8A6', // 青色
    '#9333EA', // 深紫色
    '#F97316', // 深橙色
  ];

  // 获取随机颜色
  const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colorOptions.length);
    return colorOptions[randomIndex];
  };

  useEffect(() => {
    setPromptData(initialData);
    setNewTagName('');
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPromptData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    // 创建新标签 (不生成前端 ID)
    const newTag = {
      name: newTagName.trim(),
      color: getRandomColor()
    };

    // 添加到标签列表 (需要断言类型，因为缺少 id)
    setPromptData(prev => ({
      ...prev,
      tags: [...prev.tags, newTag as Tag] // 断言为 Tag 类型以匹配状态
    }));

    // 清空输入
    setNewTagName('');
    if (tagInputRef.current) {
      tagInputRef.current.focus();
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setPromptData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.id !== tagId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: promptData.title,
      content: promptData.content,
      sourceUrl: promptData.sourceUrl,
      tags: promptData.tags
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData.id ? '编辑提示词' : '创建提示词'}
          </h2>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
          >
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="mb-5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              标题
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={promptData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
              placeholder="输入提示词标题..."
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              提示词内容
            </label>
            <textarea
              id="content"
              name="content"
              value={promptData.content}
              onChange={handleChange}
              className="w-full px-4 py-3 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors min-h-[200px] resize-none"
              placeholder="在这里输入提示词内容..."
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
              来源链接 (可选)
            </label>
            <input
              type="url"
              id="sourceUrl"
              name="sourceUrl"
              value={promptData.sourceUrl || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
              placeholder="https://example.com"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>

            <div className="flex mb-2">
              <input
                type="text"
                ref={tagInputRef}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1 px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                placeholder="输入新标签..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />

              <button
                type="button"
                onClick={handleAddTag}
                className="ml-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                添加
              </button>
            </div>

            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[44px]">
              {promptData.tags.length === 0 ? (
                <div className="text-sm text-gray-400 flex items-center">
                  <TagIcon size={16} className="mr-1" />
                  无标签
                </div>
              ) : (
                promptData.tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: `${tag.color}15`,
                      color: tag.color
                    }}
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      className="ml-1 p-0.5 rounded-full hover:bg-white hover:bg-opacity-30"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            onClick={handleSubmit}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;