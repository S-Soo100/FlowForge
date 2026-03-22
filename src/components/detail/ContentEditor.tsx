interface Props {
  content?: string;
  onChange: (content: string) => void;
}

export function ContentEditor({ content, onChange }: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        콘텐츠 (대사, 연출 메모)
      </h4>
      <textarea
        placeholder="이 이벤트에서 어떤 일이 일어나는지 적어주세요..."
        value={content ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
