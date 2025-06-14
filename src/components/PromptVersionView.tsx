import React, { useEffect, useRef } from 'react';
import { Prompt } from '../services/db';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { XIcon } from 'lucide-react';

interface PromptVersionViewProps {
  promptVersion: Prompt | null;
  onClose: () => void;
  onRevise: (prompt: Prompt) => void;
}

const PromptVersionView: React.FC<PromptVersionViewProps> = ({ promptVersion, onClose, onRevise }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (promptVersion) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [promptVersion]);

  const formatDateSafely = (dateString: string | null | undefined): string => {
    if (!dateString) return '未知时间';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value received in PromptVersionView:', dateString);
        return '无效日期';
      }
      return format(date, 'PPP p', { locale: zhCN });
    } catch (e) {
      console.error('Error formatting date in PromptVersionView:', e, 'with value:', dateString);
      return '日期格式错误';
    }
  };

  if (!promptVersion) return null;
  
  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-transparent p-0 rounded-lg shadow-xl backdrop:bg-black backdrop:bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-[1200px] p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200">
          <XIcon size={20} />
        </button>
        <h2 className="text-2xl font-bold mb-4">
          查看版本 {promptVersion.version}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">标题</label>
            <p className="mt-1 p-2 border rounded-md bg-gray-100">{promptVersion.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">内容</label>
            <textarea
              readOnly
              value={promptVersion.content}
              className="mt-1 p-2 w-full border rounded-md bg-gray-100 h-64 resize-none"
            />
          </div>
          <div className="text-sm text-gray-500">
            <p>版本创建于: {formatDateSafely(promptVersion.dateModified)}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => onRevise(promptVersion)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            以该版本为基础修改
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            关闭
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default PromptVersionView; 