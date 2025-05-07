import React from 'react';
import PromptCard from './PromptCard';
import { Prompt } from '../services/db';

type PromptGridProps = {
  prompts: Prompt[];
  onFavoriteToggle: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
};

const PromptGrid: React.FC<PromptGridProps> = ({
  prompts,
  onFavoriteToggle,
  onCopy,
  onEdit,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          id={prompt.id}
          title={prompt.title}
          content={prompt.content}
          tags={prompt.tags}
          isFavorite={prompt.isFavorite}
          dateModified={prompt.dateModified}
          onFavoriteToggle={onFavoriteToggle}
          onCopy={onCopy}
          onEdit={() => onEdit(prompt)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default PromptGrid;