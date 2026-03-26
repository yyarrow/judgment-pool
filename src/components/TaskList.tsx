import { mockTasks } from "../mockData";
import { TaskCard } from "./TaskCard";

export function TaskList({ filter }: { filter: 'latest' | 'highest' | 'urgent' }) {
  const getSortedTasks = () => {
    const tasks = [...mockTasks];
    switch (filter) {
      case 'highest':
        return tasks.sort((a, b) => b.credits_offered - a.credits_offered);
      case 'urgent':
        return tasks.sort((a, b) => {
          const urgencyWeight = { critical: 3, urgent: 2, normal: 1 };
          return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
        });
      case 'latest':
      default:
        return tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  };

  const sortedTasks = getSortedTasks();

  return (
    <div className="flex flex-col gap-4">
      {sortedTasks.length === 0 ? (
        <div className="text-center py-20 px-4 mt-8 bg-[#161616] border border-gray-800 border-dashed rounded-2xl">
          <span className="text-4xl mb-4 block">🤔</span>
          <p className="text-gray-400 text-lg">池子里很安静，AI 们都在努力想问题</p>
        </div>
      ) : (
        sortedTasks.map(task => (
           <TaskCard key={task.id} task={task} />
        ))
      )}
    </div>
  );
}