import React, { useState, useEffect } from 'react';
import { getPromptHistory, Prompt } from '../services/db';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { XIcon } from 'lucide-react';

interface PromptHistoryProps {
  promptGroupId: string;
  onClose: () => void;
  onViewVersion: (versionId: string) => void;
  isOpen: boolean;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ promptGroupId, onClose, onViewVersion, isOpen }) => {
  const [history, setHistory] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (promptGroupId) {
      setIsLoading(true);
      getPromptHistory(promptGroupId)
        .then(setHistory)
        .catch(error => console.error('Failed to fetch prompt history:', error))
        .finally(() => setIsLoading(false));
    }
  }, [promptGroupId]);

  const handleDialogClose = () => {
    onClose();
  };

  const formatDateSafely = (dateString: string | null | undefined): string => {
    if (!dateString) return '未知时间';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value received:', dateString);
        return '无效日期';
      }
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (e) {
      console.error('Error formatting date:', e, 'with value:', dateString);
      return '日期格式错误';
    }
  };
  
  return (
    <dialog ref={dialogRef} onClose={handleDialogClose} className="bg-transparent p-0 rounded-lg shadow-xl backdrop:bg-black backdrop:bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-[1200px] p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:bg-gray-200">
          <XIcon size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4">版本历史</h2>
        {isLoading ? (
          <p>正在加载历史记录...</p>
        ) : history.length === 0 ? (
          <p>没有找到历史版本。</p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {history.map((version) => (
              <li key={version.id} className="p-2 border rounded-md hover:bg-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">版本 {version.version}</span>
                    {version.isLatest && <span className="text-xs text-green-600 ml-2">(最新)</span>}
                    <p className="text-sm text-gray-500">
                      更新于 {formatDateSafely(version.dateModified)}
                    </p>
                  </div>
                  <button
                    onClick={() => onViewVersion(version.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                  >
                    查看
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 text-right">
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

export default PromptHistory; 