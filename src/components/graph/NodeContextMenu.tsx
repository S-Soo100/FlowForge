import { useEffect, useRef } from 'react';

interface Props {
  x: number;
  y: number;
  nodeId: string;
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeContextMenu({ x, y, nodeId, onEdit, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[140px]"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => { onEdit(nodeId); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        수정
      </button>
      <button
        onClick={() => {
          if (confirm('이 이벤트를 삭제할까?')) {
            onDelete(nodeId);
          }
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
      >
        삭제
      </button>
    </div>
  );
}
