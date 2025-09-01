import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  Play,
  Copy,
  MoreVertical,
  Globe,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { actionsApi } from '@/lib/api';
import type { Action, ActionFormData, ActionExecuteResponse } from '@/types/action';
import { ActionBuilder } from '@/components/actions/ActionBuilder';
import { HTTP_METHODS } from '@/types/action';

export function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [executeData, setExecuteData] = useState<string>('{}');
  const [executeResponse, setExecuteResponse] = useState<ActionExecuteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      const response = await actionsApi.list();
      setActions(response.actions || []);
    } catch (error) {
      console.error('Failed to load actions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load actions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAction = () => {
    setSelectedAction(null);
    setIsBuilderOpen(true);
  };

  const handleEditAction = (action: Action) => {
    setSelectedAction(action);
    setIsBuilderOpen(true);
  };

  const handleSaveAction = async (formData: ActionFormData) => {
    try {
      if (selectedAction) {
        await actionsApi.update(selectedAction.id, formData);
        toast({
          title: 'Success',
          description: 'Action updated successfully',
        });
      } else {
        await actionsApi.create(formData);
        toast({
          title: 'Success',
          description: 'Action created successfully',
        });
      }
      setIsBuilderOpen(false);
      loadActions();
    } catch (error) {
      console.error('Failed to save action:', error);
      toast({
        title: 'Error',
        description: 'Failed to save action',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedAction) return;

    try {
      await actionsApi.delete(selectedAction.id);
      toast({
        title: 'Success',
        description: 'Action deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setSelectedAction(null);
      loadActions();
    } catch (error) {
      console.error('Failed to delete action:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete action',
        variant: 'destructive',
      });
    }
  };

  const handleExecuteAction = (action: Action) => {
    setSelectedAction(action);
    setExecuteData('{}');
    setIsExecuteDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedAction) return;

    setIsExecuting(true);
    try {
      let data = {};
      try {
        data = JSON.parse(executeData);
      } catch {
        toast({
          title: 'Error',
          description: 'Invalid JSON data',
          variant: 'destructive',
        });
        return;
      }

      const response = await actionsApi.execute(selectedAction.id, data);
      setExecuteResponse(response);
      setIsExecuteDialogOpen(false);

      // Handle response based on type
      if (response.response_type === 'modal') {
        setIsResponseDialogOpen(true);
      } else if (response.response_type === 'toast') {
        toast({
          title: 'Action Executed',
          description: response.data || 'Success',
        });
      } else if (response.response_type === 'page') {
        // TODO: Navigate to new page with response data
        console.log('Navigate to page with:', response.data);
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute action',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyActionUrl = (action: Action) => {
    const url = `${window.location.origin}/api/actions/${action.id}/execute`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Action URL copied to clipboard',
    });
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = HTTP_METHODS.find(m => m.value === method);
    return (
      <Badge className={`${methodConfig?.color} text-white`}>
        {method}
      </Badge>
    );
  };

  if (isBuilderOpen) {
    return (
      <div className="p-6">
        <ActionBuilder
          action={selectedAction || undefined}
          onSave={handleSaveAction}
          onCancel={() => setIsBuilderOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure webhook actions and integrations
          </p>
        </div>
        <Button onClick={handleCreateAction}>
          <Plus className="mr-2 h-4 w-4" />
          New Action
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading actions...</div>
      ) : actions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No actions yet</CardTitle>
            <CardDescription>
              Create your first action to trigger webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleCreateAction}>
              <Zap className="mr-2 h-4 w-4" />
              Create Action
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Card key={action.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{action.name}</CardTitle>
                    {action.description && (
                      <CardDescription className="mt-1">
                        {action.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditAction(action)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExecuteAction(action)}>
                        <Play className="mr-2 h-4 w-4" />
                        Execute
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyActionUrl(action)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedAction(action);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getMethodBadge(action.method)}
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {action.url}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="h-4 w-4" />
                    <span>Response: {action.response_type}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleExecuteAction(action)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Execute
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Execute Action Dialog */}
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Execute Action: {selectedAction?.name}</DialogTitle>
            <DialogDescription>
              Provide any dynamic data needed for this action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dynamic Data (JSON)</Label>
              <Textarea
                value={executeData}
                onChange={(e) => setExecuteData(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm min-h-[150px]"
                rows={6}
              />
              <p className="text-xs text-gray-500">
                This data will be merged with the action's payload template
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExecuteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeAction} disabled={isExecuting}>
              {isExecuting ? 'Executing...' : 'Execute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Action Response</DialogTitle>
            <DialogDescription>
              Response from {selectedAction?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {executeResponse && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={executeResponse.success ? 'default' : 'destructive'}>
                    Status: {executeResponse.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm overflow-auto">
                    {typeof executeResponse.data === 'string'
                      ? executeResponse.data
                      : JSON.stringify(executeResponse.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsResponseDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Are you sure you want to delete "{selectedAction?.name}"?</p>
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">This action cannot be undone.</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAction}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}