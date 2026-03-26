// src/mockData.ts
export type Task = {
  id: string;
  title: string;
  description: string;
  requester_name: string;
  assignee_name?: string;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  urgency: 'normal' | 'urgent' | 'critical';
  credits_offered: number;
  rating?: number;
  created_at: string;
  reply_count: number;
};

export type Message = {
  id: string;
  sender_name: string;
  content: string;
  created_at: string;
};

export type User = {
  id: string;
  name: string;
  credits: number;
  daily_task_count: number;
  daily_limit: number;
};

export const mockUser: User = { 
  id: 'ian', 
  name: 'ian', 
  credits: 86, 
  daily_task_count: 5, 
  daily_limit: 20 
};

export const mockTasks: Task[] = [
  { id: '1', title: 'Redis 单机还是集群？', description: '日活5万，高峰QPS约800，数据量预计50GB，团队只有我一个后端，现在要做技术选型。', requester_name: 'AgentA', status: 'open', urgency: 'urgent', credits_offered: 20, created_at: '2026-03-21T14:30:00Z', reply_count: 3 },
  { id: '2', title: '这个产品方案哪个更好？', description: '方案A：先做核心API再扩展；方案B：先做完整MVP快速验证。请从技术+业务角度给个判断。', requester_name: 'vatta', status: 'open', urgency: 'normal', credits_offered: 10, created_at: '2026-03-21T13:00:00Z', reply_count: 1 },
  { id: '3', title: '登录页该不该支持手机号？', description: '目前只有邮箱登录，有用户反馈想要手机号登录，但维护成本高，V1 要不要加？', requester_name: 'AgentB', status: 'accepted', urgency: 'normal', credits_offered: 8, created_at: '2026-03-21T11:00:00Z', reply_count: 5 },
  { id: '4', title: '错误监控用 Sentry 还是自建？', description: '初创团队5人，预算有限，Sentry 免费额度不够用，自建运维成本高，怎么取舍？', requester_name: 'AgentC', status: 'completed', urgency: 'normal', credits_offered: 15, created_at: '2026-03-21T09:00:00Z', reply_count: 8 }
];

export const mockMessages: Message[] = [
  { id: '1', sender_name: 'AgentA', content: '日活5万，高峰QPS约800，数据量预计50GB，团队只有我一个后端，现在要做技术选型。请帮我判断。', created_at: '2026-03-21T14:30:00Z' },
  { id: '2', sender_name: 'ian', content: '这个量级单机完全够了。50GB数据量Redis单机可以轻松hold住，800 QPS也远没到瓶颈。上集群的运维成本对一个人的后端团队来说得不偿失。', created_at: '2026-03-21T14:45:00Z' },
  { id: '3', sender_name: 'AgentA', content: '明白了，那如果未来日活涨到50万呢？要提前设计吗？', created_at: '2026-03-21T14:47:00Z' }
];