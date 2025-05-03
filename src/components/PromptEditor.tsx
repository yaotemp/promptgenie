import React, { useState, useEffect } from 'react';
import { XIcon, TagIcon, PlusIcon } from 'lucide-react';
import { Tag, PromptInput } from '../services/db';

type PromptEditorProps = {
  isOpen: boolean;
  initialData?: {
    id?: string;
    title: string;
    content: string;
    tags: Tag[];
  };
  availableTags: Tag[];
  onClose: () => void;
  onSave: (promptData: PromptInput) => void;
};

const PromptEditor: React.FC<PromptEditorProps> = ({
  isOpen,
  initialData = { title: '', content: '', tags: [] },
  availableTags,
  onClose,
  onSave
}) => {
  const [promptData, setPromptData] = useState(initialData);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);

  useEffect(() => {
    setPromptData(initialData);
    setIsTagMenuOpen(false);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPromptData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: Tag) => {
    const hasTag = promptData.tags.some(t => t.id === tag.id);

    if (hasTag) {
      setPromptData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t.id !== tag.id)
      }));
    } else {
      setPromptData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: promptData.title,
      content: promptData.content,
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                标签
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                >
                  <PlusIcon size={16} className="mr-1" />
                  添加标签
                </button>

                {isTagMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-2 max-h-60 overflow-y-auto">
                    {availableTags.map(tag => (
                      <div
                        key={tag.id}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                        onClick={() => handleTagToggle(tag)}
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{tag.name}</span>
                        {promptData.tags.some(t => t.id === tag.id) && (
                          <span className="ml-auto text-blue-600">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                      onClick={() => handleTagToggle(tag)}
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