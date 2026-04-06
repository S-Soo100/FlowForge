import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectVariable, VariableCategory, VariableValueType } from '../types';

export function useProjectVariables(projectId: string) {
  const [variables, setVariables] = useState<ProjectVariable[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('project_variables')
      .select('*')
      .eq('project_id', projectId)
      .order('category')
      .order('sort_order');
    setVariables((data ?? []) as ProjectVariable[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // 카테고리별 필터
  const getByCategory = useCallback(
    (cat: VariableCategory) => variables.filter(v => v.category === cat),
    [variables]
  );

  // 추가
  const addVariable = useCallback(async (params: {
    category: VariableCategory;
    key: string;
    value_type?: VariableValueType;
    default_value?: string;
    file_name?: string;
  }) => {
    const maxOrder = variables
      .filter(v => v.category === params.category)
      .reduce((max, v) => Math.max(max, v.sort_order), -1);

    const { data, error } = await supabase
      .from('project_variables')
      .insert({
        project_id: projectId,
        category: params.category,
        key: params.key,
        value_type: params.value_type || null,
        default_value: params.default_value || null,
        file_name: params.file_name || null,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) throw error;
    setVariables(prev => [...prev, data as ProjectVariable]);
    return data as ProjectVariable;
  }, [projectId, variables]);

  // 수정
  const updateVariable = useCallback(async (id: string, updates: Partial<Pick<ProjectVariable, 'key' | 'value_type' | 'default_value' | 'file_name'>>) => {
    await supabase.from('project_variables').update(updates).eq('id', id);
    setVariables(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  // 삭제
  const deleteVariable = useCallback(async (id: string) => {
    await supabase.from('project_variables').delete().eq('id', id);
    setVariables(prev => prev.filter(v => v.id !== id));
  }, []);

  return { variables, loading, getByCategory, addVariable, updateVariable, deleteVariable, reload: load };
}
