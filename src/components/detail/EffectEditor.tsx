import type { EventEffect } from '../../types';

interface Props {
  effects: EventEffect[];
  onChange: (effects: EventEffect[]) => void;
}

export function EffectEditor({ effects, onChange }: Props) {
  const addEffect = () => {
    onChange([...effects, { type: 'set_state', key: '', value: '' }]);
  };

  const updateEffect = (index: number, patch: Partial<EventEffect>) => {
    const updated = effects.map((eff, i) =>
      i === index ? { ...eff, ...patch } : eff
    );
    onChange(updated);
  };

  const removeEffect = (index: number) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          효과 (Effects)
        </h4>
        <button
          onClick={addEffect}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          + 추가
        </button>
      </div>

      {effects.length === 0 && (
        <p className="text-xs text-gray-400">아직 효과가 없어요</p>
      )}

      {effects.map((eff, i) => (
        <div key={i} className="flex gap-2 items-start">
          <select
            value={eff.type}
            onChange={(e) => updateEffect(i, { type: e.target.value })}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="set_state">상태 변경</option>
            <option value="call_event">이벤트 호출</option>
          </select>

          {eff.type === 'set_state' ? (
            <>
              <input
                type="text"
                placeholder="key"
                value={eff.key ?? ''}
                onChange={(e) => updateEffect(i, { key: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="value"
                value={String(eff.value ?? '')}
                onChange={(e) => updateEffect(i, { value: e.target.value })}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </>
          ) : (
            <input
              type="text"
              placeholder="대상 이벤트 ID"
              value={eff.targetEventId ?? ''}
              onChange={(e) => updateEffect(i, { targetEventId: e.target.value })}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}

          <button
            onClick={() => removeEffect(i)}
            className="text-gray-400 hover:text-red-500 text-xs px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
