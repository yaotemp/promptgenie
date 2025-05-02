import React, { useState } from 'react';
import Header from './Header';
import PromptGrid from './PromptGrid';
import PromptList from './PromptList';

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

type MainContentProps = {
  title: string;
};

const MainContent: React.FC<MainContentProps> = ({ title }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mock data - in a real app, this would come from props or context
  const mockPrompts: Prompt[] = [
    {
      id: '1',
      title: '专业文案撰写助手',
      content: '请帮我撰写一篇关于[主题]的专业文章，要求语言流畅，结构清晰，包含引言、主体和结论三部分。文章风格要专业但不呆板，适合在社交媒体上分享。字数在800-1200之间。',
      category: '文案创作',
      tags: [
        { id: '1', name: '营销', color: '#3B82F6' },
        { id: '2', name: '专业', color: '#10B981' }
      ],
      isFavorite: true,
      dateCreated: '2025-05-15',
      dateModified: '2025-05-16'
    },
    {
      id: '2',
      title: 'React组件开发指南',
      content: '我需要创建一个React组件，功能是[功能描述]。请提供完整的TypeScript代码，包括组件定义、状态管理、样式和必要的注释。代码应当遵循最佳实践，确保可复用性和性能优化。',
      category: '代码编程',
      tags: [
        { id: '3', name: 'React', color: '#8B5CF6' },
        { id: '4', name: 'TypeScript', color: '#EC4899' }
      ],
      isFavorite: false,
      dateCreated: '2025-05-10',
      dateModified: '2025-05-14'
    },
    {
      id: '3',
      title: 'UI设计规范提示',
      content: '请为我的[产品类型]应用设计一套UI规范，包括颜色方案、排版、组件样式和交互模式。设计风格应当现代简约，符合2025年的设计趋势，并兼顾可访问性。',
      category: '设计创作',
      tags: [
        { id: '5', name: 'UI设计', color: '#F59E0B' },
        { id: '6', name: '规范', color: '#6366F1' }
      ],
      isFavorite: true,
      dateCreated: '2025-05-05',
      dateModified: '2025-05-12'
    },
    {
      id: '4',
      title: '数据分析报告生成器',
      content: '我有一组关于[数据主题]的数据，请帮我分析并生成一份详细的报告。报告应包含数据趋势、关键见解、可视化建议和未来预测。分析应当客观专业，并提供actionable insights。',
      category: '数据分析',
      tags: [
        { id: '7', name: '数据', color: '#EF4444' },
        { id: '8', name: '报告', color: '#14B8A6' }
      ],
      isFavorite: false,
      dateCreated: '2025-04-28',
      dateModified: '2025-05-08'
    },
    {
      id: '5',
      title: '产品描述优化',
      content: '请优化以下产品描述，使其更具吸引力和说服力：[原描述]。优化后的描述应突出产品的独特卖点，使用吸引人的语言，并包含适当的情感诉求和号召性用语。',
      category: '文案创作',
      tags: [
        { id: '1', name: '营销', color: '#3B82F6' },
        { id: '9', name: '电商', color: '#9333EA' }
      ],
      isFavorite: true,
      dateCreated: '2025-05-01',
      dateModified: '2025-05-11'
    },
    {
      id: '6',
      title: 'AI绘画提示词',
      content: '创建一幅[场景描述]的数字艺术作品。风格应为[艺术风格]，色调以[主色调]为主，具有[情绪/氛围]的氛围。作品应当细节丰富，构图平衡，适合作为[用途]使用。',
      category: '设计创作',
      tags: [
        { id: '10', name: 'AI绘画', color: '#8B5CF6' },
        { id: '11', name: '创意', color: '#F97316' }
      ],
      isFavorite: false,
      dateCreated: '2025-05-07',
      dateModified: '2025-05-15'
    }
  ];
  
  const handleFavoriteToggle = (id: string) => {
    console.log(`Toggle favorite for prompt ${id}`);
  };
  
  const handleCopy = (id: string) => {
    console.log(`Copy prompt ${id}`);
  };
  
  const handleEdit = (id: string) => {
    console.log(`Edit prompt ${id}`);
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title={title} 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {viewMode === 'grid' ? (
          <PromptGrid 
            prompts={mockPrompts}
            onFavoriteToggle={handleFavoriteToggle}
            onCopy={handleCopy}
            onEdit={handleEdit}
          />
        ) : (
          <PromptList 
            prompts={mockPrompts}
            onFavoriteToggle={handleFavoriteToggle}
            onCopy={handleCopy}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;