import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import PromptEditor from './components/PromptEditor';

function App() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Mock data for the editor
  const categories = [
    { id: '1', name: '文案创作' },
    { id: '2', name: '代码编程' },
    { id: '3', name: '设计创作' },
    { id: '4', name: '数据分析' },
    { id: '5', name: '其他' }
  ];
  
  const availableTags = [
    { id: '1', name: '营销', color: '#3B82F6' },
    { id: '2', name: '专业', color: '#10B981' },
    { id: '3', name: 'React', color: '#8B5CF6' },
    { id: '4', name: 'TypeScript', color: '#EC4899' },
    { id: '5', name: 'UI设计', color: '#F59E0B' },
    { id: '6', name: '规范', color: '#6366F1' },
    { id: '7', name: '数据', color: '#EF4444' },
    { id: '8', name: '报告', color: '#14B8A6' },
    { id: '9', name: '电商', color: '#9333EA' },
    { id: '10', name: 'AI绘画', color: '#8B5CF6' },
    { id: '11', name: '创意', color: '#F97316' }
  ];

  const handleEditorOpen = () => {
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
  };

  const handleSavePrompt = (promptData: any) => {
    console.log('Save prompt:', promptData);
    setIsEditorOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
      <Sidebar />
      
      <MainContent title="所有提示词" />
      
      {/* Floating action button for new prompt */}
      <div className="fixed right-8 bottom-8">
        <button 
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          onClick={handleEditorOpen}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      
      {/* Prompt Editor Modal */}
      <PromptEditor 
        isOpen={isEditorOpen}
        initialData={{
          title: '',
          content: '',
          category: '',
          tags: []
        }}
        categories={categories}
        availableTags={availableTags}
        onClose={handleEditorClose}
        onSave={handleSavePrompt}
      />
    </div>
  );
}

export default App;