import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, XCircle } from "lucide-react";
import { mockTasks, mockMessages, mockUser } from "../mockData";
import { useState } from "react";

export function TaskDetailPage() {
  const { id } = useParams();
  const task = mockTasks.find(t => t.id === id);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const isRequester = task?.requester_name === mockUser.name;
  
  if (!task) return <div className="p-8 text-center text-gray-400">Task not found</div>;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'urgent': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-gray-400 bg-gray-800/50 border-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="flex items-center gap-1.5 text-green-500 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Open</span>;
      case 'accepted': return <span className="flex items-center gap-1.5 text-blue-500 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Accepted</span>;
      case 'completed': return <span className="flex items-center gap-1.5 text-gray-500 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Completed</span>;
      case 'cancelled': return <span className="flex items-center gap-1.5 text-gray-700 text-sm"><div className="w-1.5 h-1.5 rounded-full bg-gray-700" /> Cancelled</span>;
      default: return null;
    }
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender_name: mockUser.name,
      content: newMessage,
      created_at: new Date().toISOString()
    }]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold text-white leading-tight line-clamp-1 flex-1">
          {task.title}
        </h1>
        {getStatusBadge(task.status)}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-24 pr-2 custom-scrollbar">
        {/* Info Card */}
        <div className="bg-[#161616] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-start justify-between gap-6 mb-4">
            <p className="text-gray-300 leading-relaxed text-base">
              {task.description}
            </p>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-3xl font-bold text-amber-500 tracking-tight">{task.credits_offered}</span>
              <span className="text-amber-500/60 text-xs font-semibold uppercase tracking-wider">Credits</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-800/50">
            <span className="text-gray-400 font-medium">@{task.requester_name}</span>
            <span>·</span>
            <time>{new Date(task.created_at).toLocaleString()}</time>
            {task.urgency !== 'normal' && (
              <>
                <span>·</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getUrgencyColor(task.urgency)} uppercase tracking-wider`}>
                  {task.urgency}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Area */}
        {task.status === 'open' && !isRequester && (
          <div className="flex justify-center py-4">
            <button className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2">
              <CheckCircle2 size={18} />
              接下这个判断
            </button>
          </div>
        )}

        {task.status === 'open' && isRequester && (
          <div className="flex justify-end pt-2">
            <button className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-transparent hover:border-red-500/20">
              <XCircle size={16} />
              取消任务并退回Credits
            </button>
          </div>
        )}

        {task.status === 'accepted' && isRequester && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex items-center justify-between">
            <div className="text-sm">
              <p className="text-amber-500 font-medium mb-1">等待你确认</p>
              <p className="text-gray-400">如果对方提供了有价值的判断，请标记完成以支付 {task.credits_offered} Credits</p>
            </div>
            <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm">
              标记完成
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 mt-8">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider pl-2 block">讨论</h3>
          {messages.map((msg) => (
             <div key={msg.id} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0 select-none uppercase shadow-sm">
                {msg.sender_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className={`font-semibold text-sm ${msg.sender_name === task.requester_name ? 'text-blue-400' : 'text-gray-200'}`}>
                    {msg.sender_name}
                  </span>
                  {msg.sender_name === task.requester_name && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 rounded uppercase tracking-wider font-bold">OP</span>
                  )}
                  <time className="text-xs text-gray-600 font-medium">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                </div>
                <div className="text-gray-300 text-[15px] leading-relaxed break-words bg-[#161616] p-4 rounded-2xl rounded-tl-sm border border-gray-800 shadow-sm relative group-hover:border-gray-700 transition-colors inline-block max-w-[85%]">
                   {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

       {/* Input Area */}
      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] pt-4 pb-2 border-t border-gray-800/80 mt-auto">
          <div className="flex items-end gap-2 bg-[#1a1a1a] rounded-xl p-2 border border-gray-800 focus-within:border-gray-600 focus-within:bg-[#1f1f1f] transition-all shadow-sm">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="分享你的判断..."
              className="w-full bg-transparent text-white focus:outline-none resize-none px-3 py-2 max-h-32 min-h-[44px] custom-scrollbar text-[15px]"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="p-2.5 rounded-lg bg-white text-black disabled:opacity-30 disabled:bg-gray-800 disabled:text-gray-500 hover:bg-gray-200 transition-all shrink-0 mb-0.5"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}