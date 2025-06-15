import React from 'react';
// @ts-ignore
import { StarIcon, CopyIcon, PencilIcon, TagIcon, TrashIcon, HistoryIcon, ExternalLinkIcon } from 'lucide-react';
import { Tag } from '../services/db';
import { formatRelativeTime } from '../utils/time';

type PromptCardProps = {
  id: string;
  promptGroupId: string;
  title: string;
  content: string;
  sourceUrl?: string;
  note?: string;
  tags: Tag[];
  isFavorite: boolean;
  dateModified: string;
  onFavoriteToggle: (promptGroupId: string) => void;
  onCopy: (id: string) => void;
  onEdit: () => void;
  onDelete: (promptGroupId: string) => void;
  onHistory: (promptGroupId: string) => void;
};

const PromptCard: React.FC<PromptCardProps> = ({
  id,
  promptGroupId,
  title,
  content,
  sourceUrl,
  note,
  tags,
  isFavorite,
  dateModified,
  onFavoriteToggle,
  onCopy,
  onEdit,
  onDelete,
  onHistory
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-medium text-gray-800 line-clamp-1">{title}</h3>
          <button
            className={`p-1 rounded-full ${isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
            onClick={() => onFavoriteToggle(promptGroupId)}
          >
            <StarIcon size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{content}</p>

        {sourceUrl && (
          <div className="mb-3">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLinkIcon size={12} className="mr-1" />
              来源链接
            </a>
          </div>
        )}

        {note && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 line-clamp-2">
              <span className="font-medium">备注：</span>
              {note}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map(tag => (
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
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-500" title={new Date(dateModified).toLocaleString()}>
          修改于 {formatRelativeTime(dateModified)}
        </div>

        <div className="flex space-x-1">
          <button
            className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
            onClick={() => onHistory(promptGroupId)}
            title="查看历史记录"
          >
            <HistoryIcon size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
            onClick={() => onCopy(id)}
            title="复制提示词"
          >
            <CopyIcon size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
            onClick={onEdit}
            title="编辑提示词"
          >
            <PencilIcon size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            onClick={() => onDelete(promptGroupId)}
            title="删除提示词"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;