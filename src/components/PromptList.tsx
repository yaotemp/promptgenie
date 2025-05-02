import React from 'react';
import { StarIcon, CopyIcon, PencilIcon, TagIcon, TrashIcon } from 'lucide-react';
import { Prompt } from '../services/db';
import { formatRelativeTime } from '../utils/time';

type PromptListProps = {
  prompts: Prompt[];
  onFavoriteToggle: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
};

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  onFavoriteToggle,
  onCopy,
  onEdit,
  onDelete
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">提示词</th>
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
              <td className="px-6 py-4 text-sm text-gray-500" title={new Date(prompt.dateModified).toLocaleString()}>
                {formatRelativeTime(prompt.dateModified)}
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
                    onClick={() => onEdit(prompt)}
                    title="编辑提示词"
                  >
                    <PencilIcon size={16} />
                  </button>
                  <button
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    onClick={() => onDelete(prompt.id)}
                    title="删除提示词"
                  >
                    <TrashIcon size={16} />
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