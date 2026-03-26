import { Link } from "react-router-dom";
import type { Task } from "../mockData";
import { MessageSquare, Clock } from "lucide-react";

export function TaskCard({ task }: { task: Task }) {
  const getUrgencyColor = (urgency: Task['urgency']) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      default: return 'bg-transparent';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'accepted': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-gray-700';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Link 
      to={`/task/${task.id}`} 
      className="block bg-[#161616] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors group relative"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getUrgencyColor(task.urgency)}`} />
      
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-medium text-gray-100 group-hover:text-white line-clamp-1 flex-1">
            {task.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {task.urgency !== 'normal' && (
              <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-white ${task.urgency === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {task.urgency}
              </span>
            )}
            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
          </div>
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
          {task.description}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 gap-4">
          <div className="flex items-center gap-1.5 font-medium text-amber-500">
            <span className="text-sm">{task.credits_offered}</span>
            <span>CR</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-400">{task.requester_name}</span>
          </div>
          
          <div className="flex items-center gap-1 ml-auto">
            <Clock size={12} />
            <span>{new Date(task.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <MessageSquare size={12} />
            <span>{task.reply_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}