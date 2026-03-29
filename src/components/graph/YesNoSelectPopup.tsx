interface Props {
  onSelect: (choice: 'yes' | 'no') => void;
  onClose: () => void;
}

export function YesNoSelectPopup({ onSelect, onClose }: Props) {
  return (
    // 배경 오버레이 — 클릭 시 닫힘
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-xl p-5 flex flex-col items-center gap-4"
        style={{ minWidth: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-gray-700">이 연결은 On/Off 중 무엇인가요?</p>
        <div className="flex gap-3">
          <button
            onClick={() => onSelect('yes')}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 transition"
          >
            On
          </button>
          <button
            onClick={() => onSelect('no')}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition"
          >
            Off
          </button>
        </div>
        <p className="text-[11px] text-gray-400">배경 클릭으로 취소</p>
      </div>
    </div>
  );
}
