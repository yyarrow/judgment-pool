import { TaskList } from "../components/TaskList";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { mockUser } from "../mockData";

export function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'latest' | 'highest' | 'urgent'>('latest');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-[#161616] p-1 rounded-lg border border-gray-800">
          {(['latest', 'highest', 'urgent'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === f 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {f === 'latest' ? '最新' : f === 'highest' ? '高悬赏' : '最急'}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ml-auto shadow-sm"
        >
          <Plus size={18} />
          <span>提问求助</span>
        </button>
      </div>

      <TaskList filter={filter} />
      
      {isModalOpen && <CreateTaskModal onClose={() => setIsModalOpen(false)} user={mockUser} />}
    </div>
  );
}