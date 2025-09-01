import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FolderOpen, Database, MessageSquare, Zap, Activity } from 'lucide-react';

export function DashboardPage() {
  const stats = [
    { name: 'Forms', value: '0', icon: FileText, color: 'text-blue-600' },
    { name: 'Files', value: '0', icon: FolderOpen, color: 'text-green-600' },
    { name: 'Tables', value: '8', icon: Database, color: 'text-purple-600' },
    { name: 'Conversations', value: '0', icon: MessageSquare, color: 'text-orange-600' },
    { name: 'Actions', value: '0', icon: Zap, color: 'text-red-600' },
    { name: 'Active', value: 'Yes', icon: Activity, color: 'text-emerald-600' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to WorkflowHub - Your workflow automation platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>Create a new form</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <FolderOpen className="h-4 w-4 text-gray-400" />
                <span>Upload files</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <span>Start a conversation</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="h-4 w-4 text-gray-400" />
                <span>Configure an action</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}