import React from 'react';
import { StarIcon, CopyIcon, PencilIcon, TagIcon, TrashIcon } from 'lucide-react';
import { Tag } from '../services/db';

type PromptCardProps = {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
  onFavoriteToggle: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
};

const PromptCard: React.FC<PromptCardProps> = ({
  id,
  title,
  content,
  tags,
  isFavorite,
  dateCreated,
  dateModified,
  onFavoriteToggle,
  onCopy,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150 overflow-hidden flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-medium text-gray-800 line-clamp-1">{title}</h3>
          <button
            className={`p-1 rounded-full ${isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
            onClick={() => onFavoriteToggle(id)}
          >
            <StarIcon size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{content}</p>

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
        <div className="text-xs text-gray-500">
          修改于 {dateModified}
        </div>

        <div className="flex space-x-1">
          <button
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            onClick={() => onCopy(id)}
            title="复制提示词"
          >
            <CopyIcon size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            onClick={onEdit}
            title="编辑提示词"
          >
            <PencilIcon size={16} />
          </button>
          <button
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            onClick={() => onDelete(id)}
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