import React from 'react';
import PromptCard from './PromptCard';

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

type PromptGridProps = {
  prompts: Prompt[];
  onFavoriteToggle: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: (id: string) => void;
};

const PromptGrid: React.FC<PromptGridProps> = ({ prompts, onFavoriteToggle, onCopy, onEdit }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {prompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          id={prompt.id}
          title={prompt.title}
          content={prompt.content}
          category={prompt.category}
          tags={prompt.tags}
          isFavorite={prompt.isFavorite}
          dateCreated={prompt.dateCreated}
          dateModified={prompt.dateModified}
          onFavoriteToggle={onFavoriteToggle}
          onCopy={onCopy}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default PromptGrid;