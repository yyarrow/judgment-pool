import { useState } from "react";
import type { User, Task } from "../mockData";
import { X } from "lucide-react";

export function CreateTaskModal({ onClose, user }: { onClose: () => void, user: User }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: 'poll',
    title: '',
    description: '',
    credits: 10,
    urgency: 'normal' as Task['urgency'],
    assignee: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">发布任务</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">选择类型</h3>
              <div className="grid grid-cols-3 gap-3">
                {['poll', 'post', 'chat'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      form.type === t 
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                        : 'border-gray-800 hover:border-gray-600 text-gray-400 hover:text-gray-200 bg-[#161616]'
                    }`}
                  >
                    <span className="font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => setStep(2)}
                className="w-full bg-white text-black font-semibold py-3 flex-1 rounded-lg mt-6"
              >
                下一步
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">标题</label>
                <input 
                  autoFocus
                  type="text" 
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#161616] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="一句话描述你的问题..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">详情描述</label>
                <textarea 
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#161616] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  placeholder="提供更多背景信息，帮助判断者做出更好决策..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="border border-gray-800 hover:bg-[#161616] text-white font-medium py-3 px-6 rounded-lg"
                >
                  返回
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  disabled={!form.title.trim() || !form.description.trim()}
                  className="bg-white text-black font-semibold py-3 flex-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 flex justify-between">
                  <span>悬赏金额 (Credits)</span>
                  <span className="text-gray-500">余额: {user.credits}</span>
                </label>
                <input 
                  type="number" 
                  value={form.credits}
                  onChange={e => setForm(prev => ({ ...prev, credits: Number(e.target.value) }))}
                  min={1}
                  max={user.credits}
                  className="w-full bg-[#161616] border border-amber-500/30 text-amber-500 text-lg font-bold rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">紧急程度</label>
                <div className="flex gap-2">
                  {(['normal', 'urgent', 'critical'] as const).map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, urgency: u }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.urgency === u
                          ? (u === 'critical' ? 'bg-red-500/10 border-red-500 text-red-500' 
                             : u === 'urgent' ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                             : 'bg-white text-black border-white')
                          : 'bg-[#161616] border-gray-800 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {u === 'normal' ? '普通' : u === 'urgent' ? '紧急' : '关键'}
                    </button>
                  ))}
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">指定回答者 (可选)</label>
                <input 
                  type="text" 
                  value={form.assignee}
                  onChange={e => setForm(prev => ({ ...prev, assignee: e.target.value }))}
                  className="w-full bg-[#161616] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-gray-600"
                  placeholder="@username"
                />
                <p className="text-xs text-gray-500 mt-2">指定不等于强制，对方可以拒绝</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-6">
                <p className="text-amber-500/80 text-sm text-center">
                  发布将从余额扣除 <strong className="text-amber-500 text-base">{form.credits} credits</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="border border-gray-800 hover:bg-[#161616] text-white font-medium py-3 px-6 rounded-lg"
                >
                  返回
                </button>
                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 flex-1 rounded-lg transition-colors shadow-sm"
                >
                  确认发布
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}