import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { TaskCard } from "@/components/TaskCard";
import type { Task } from "@/lib/store";
import { motion } from "framer-motion";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function DashboardPage({ tasks, onEdit, onDelete }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "inprogress").length;
  const recent = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: "Total Tasks", value: total, icon: ListTodo, color: "text-foreground" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-status-completed" },
    { label: "In Progress", value: inProgress, icon: TrendingUp, color: "text-status-inprogress" },
    { label: "Pending", value: pending, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="flex flex-col h-full">
      <TopNav title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Recent Tasks</h2>
          <div className="space-y-2">
            {recent.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
