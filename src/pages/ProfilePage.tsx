import { mockUser, mockTasks } from "../mockData";
import { TaskCard } from "../components/TaskCard";
import { Award, Target, Zap } from "lucide-react";

export function ProfilePage() {
  const publishedTasks = mockTasks.filter(t => t.requester_name === mockUser.name);
  const acceptedTasks = mockTasks.filter(t => t.assignee_name === mockUser.name); // Mock Data doesn't have assignee_name populated yet, but logially correct.

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-16">
      
      {/* Header Info */}
      <div className="flex flex-col items-center justify-center text-center mt-12 mb-16">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto border-4 border-[#0f0f0f] shadow-2xl relative z-10">
             <span className="text-4xl font-black text-white uppercase tracking-tighter">
              {mockUser.name.slice(0, 2)}
             </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{mockUser.name}</h1>
        
        <div className="flex flex-col items-center mt-8 space-y-2">
           <span className="text-gray-500 text-sm uppercase tracking-widest font-semibold flex items-center gap-1.5"><Award size={14}/> 累计 Credits</span>
           <span className="text-6xl font-black text-amber-500 tabular-nums tracking-tighter drop-shadow-md">
             {mockUser.credits}
           </span>
        </div>
      </div>

       {/* Daily Progress */}
      <div className="bg-[#161616] rounded-2xl p-6 border border-gray-800 relative overflow-hidden group hover:border-gray-700 transition-colors">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h2 className="text-gray-300 font-medium flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            今日输出判断
          </h2>
          <span className="text-white font-bold bg-gray-800 px-3 py-1 rounded-full text-sm flex items-baseline gap-1">
            {mockUser.daily_task_count} <span className="text-gray-500 font-medium text-xs">/ {mockUser.daily_limit}</span>
          </span>
        </div>
        
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden relative z-10 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full relative"
            style={{ width: `${(mockUser.daily_task_count / mockUser.daily_limit) * 100}%` }}
          >
             <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12" />
          </div>
        </div>
        
        <p className="text-sm mt-4 text-gray-400 flex items-center gap-1.5">
          <Target size={14} className="text-green-500" />
          "今天已输出 5 个判断，状态不错 🧠"
        </p>
      </div>

      {/* Tabs (Simple Implementation for now) */}
      <div className="space-y-6">
        <div className="flex gap-8 border-b border-gray-800 px-2 pb-px">
          <button className="text-white border-b-2 border-white pb-3 font-medium text-[15px] px-1 transition-colors">
            我发布的 ({publishedTasks.length})
          </button>
          <button className="text-gray-500 hover:text-gray-300 pb-3 font-medium text-[15px] px-1 transition-colors">
            我接过的 ({acceptedTasks.length})
          </button>
        </div>

        <div className="space-y-4">
           {publishedTasks.length === 0 ? (
             <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-[#161616]">
                暂无记录，去广场看看吧 👀
             </div>
           ) : (
             publishedTasks.map(task => (
                <TaskCard key={task.id} task={task} />
             ))
           )}
        </div>
      </div>
    </div>
  );
}