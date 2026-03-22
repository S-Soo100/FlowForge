import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

export function useProject(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // 내가 owner이거나 member인 프로젝트 모두 조회
    const { data: owned } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });

    const { data: memberRows } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);

    let shared: Project[] = [];
    if (memberRows && memberRows.length > 0) {
      const ids = memberRows.map((r) => r.project_id);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids)
        .order('updated_at', { ascending: false });
      shared = data ?? [];
    }

    // 중복 제거 후 합치기
    const map = new Map<string, Project>();
    for (const p of [...(owned ?? []), ...shared]) {
      map.set(p.id, p);
    }
    setProjects(Array.from(map.values()));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, description?: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: userId })
      .select()
      .single();

    if (error) throw error;
    await fetchProjects();
    return data as Project;
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('owner_id', userId!); // owner만 삭제 가능

    if (error) throw error;
    await fetchProjects();
  };

  return { projects, loading, createProject, deleteProject, refresh: fetchProjects };
}
