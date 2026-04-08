import { memo, useCallback, useRef, useState } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import type { MemoNodeData } from '../../types';

type MemoNodeType = Node<MemoNodeData>;

interface MemoNodeProps extends NodeProps<MemoNodeType> {
  // data.onTextChange는 EventCanvas에서 클로저로 주입됨
}

export const MemoNode = memo(function MemoNode({ id, data, selected }: MemoNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDoubleClick = useCallback(() => {
    setDraftText(data.text);
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [data.text]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (draftText !== data.text) {
      const onTextChange = data.onTextChange as ((id: string, text: string) => void) | undefined;
      onTextChange?.(id, draftText);
    }
  }, [id, draftText, data.text, data.onTextChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        setDraftText(data.text);
        setIsEditing(false);
      }
      // Shift+Enter: 줄바꿈 허용, Enter만: 저장
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        textareaRef.current?.blur();
      }
      // 텍스트 편집 중에는 Delete 키가 노드 삭제로 전파되지 않게
      e.stopPropagation();
    },
    [data.text]
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={[
        'relative min-w-[150px] min-h-[100px] max-w-[300px] rounded-sm shadow-md',
        'bg-amber-100 border-2',
        selected ? 'border-blue-500' : 'border-amber-300',
        'p-3 cursor-default',
      ].join(' ')}
      style={{ fontFamily: 'inherit' }}
    >
      {/* 스티키노트 상단 띠 */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-amber-300 rounded-t-sm opacity-60" />

      <div className="relative mt-4">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[70px] bg-transparent resize-none outline-none text-sm text-amber-900 placeholder-amber-400"
            placeholder="메모를 입력하세요..."
            rows={4}
          />
        ) : (
          <p
            className={[
              'text-sm text-amber-900 whitespace-pre-wrap break-words min-h-[70px]',
              !data.text ? 'text-amber-400 italic' : '',
            ].join(' ')}
          >
            {data.text || '더블클릭으로 편집'}
          </p>
        )}
      </div>
    </div>
  );
});
