import React from 'react';
import { StarIcon, CopyIcon, PencilIcon, TagIcon, MoreHorizontalIcon } from 'lucide-react';

type Tag = {
  id: string;
  name: string;
  color: string;
};

type Prompt = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: Tag[];
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
};

type PromptListProps = {
  prompts: Prompt[];
  onFavoriteToggle: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: (id: string) => void;
};

const PromptList: React.FC<PromptListProps> = ({ prompts, onFavoriteToggle, onCopy, onEdit }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">提示词</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">标签</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">修改日期</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">收藏</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">操作</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {prompts.map(prompt => (
            <tr key={prompt.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">{prompt.title}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">{prompt.content}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-md">
                  {prompt.category}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {prompt.tags.map(tag => (
                    <div 
                      key={tag.id} 
                      className="flex items-center px-2 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: `${tag.color}15`,
                        color: tag.color
                      }}
                    >
                      <TagIcon size={12} className="mr-1" />
                      {tag.name}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {prompt.dateModified}
              </td>
              <td className="px-6 py-4 text-center">
                <button 
                  className={`p-1 rounded-full ${prompt.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
                  onClick={() => onFavoriteToggle(prompt.id)}
                >
                  <StarIcon size={18} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-1">
                  <button 
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    onClick={() => onCopy(prompt.id)}
                    title="复制提示词"
                  >
                    <CopyIcon size={16} />
                  </button>
                  <button 
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    onClick={() => onEdit(prompt.id)}
                    title="编辑提示词"
                  >
                    <PencilIcon size={16} />
                  </button>
                  <button 
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="更多选项"
                  >
                    <MoreHorizontalIcon size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PromptList;