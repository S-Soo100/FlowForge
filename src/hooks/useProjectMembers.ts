import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectRole } from '../types';

export interface MemberInfo {
  id: string;           // project_members row id
  user_id: string;
  email: string;
  role: ProjectRole;
}

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('project_members')
      .select('id, user_id, role, email')
      .eq('project_id', projectId);

    if (!data || data.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // 프로필에서 이름 조회
    const userIds = data.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name])
    );

    const memberInfos: MemberInfo[] = data.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      email: profileMap.get(m.user_id) || m.email || m.user_id.slice(0, 8) + '...',
      role: m.role as ProjectRole,
    }));

    setMembers(memberInfos);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteByEmail = useCallback(async (email: string, role: ProjectRole) => {
    // Supabase에서 이메일로 유저 찾기 (admin API 없이 가능한 방법)
    // RPC 함수로 처리
    const { data, error } = await supabase.rpc('find_user_by_email', { target_email: email });

    if (error || !data) {
      return { error: '해당 이메일의 유저를 찾을 수 없어요. 먼저 회원가입이 필요합니다.' };
    }

    const userId = data as string;

    // 이미 멤버인지 확인
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return { error: '이미 프로젝트 멤버입니다.' };
    }

    const { error: insertError } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role, email });

    if (insertError) {
      return { error: insertError.message };
    }

    await fetchMembers();
    return { error: null };
  }, [projectId, fetchMembers]);

  const updateRole = useCallback(async (memberId: string, role: ProjectRole) => {
    await supabase
      .from('project_members')
      .update({ role })
      .eq('id', memberId);

    await fetchMembers();
  }, [fetchMembers]);

  const removeMember = useCallback(async (memberId: string) => {
    await supabase
      .from('project_members')
      .delete()
      .eq('id', memberId);

    await fetchMembers();
  }, [fetchMembers]);

  return { members, loading, inviteByEmail, updateRole, removeMember, refresh: fetchMembers };
}
