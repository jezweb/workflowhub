import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit, Plus, Eye, EyeOff } from 'lucide-react';
import { variablesApi } from '@/lib/api/context';
import type { CustomVariable } from '@/types/context';

export function VariablesSettings() {
  const [globalVars, setGlobalVars] = useState<CustomVariable[]>([]);
  const [userVars, setUserVars] = useState<CustomVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVar, setEditingVar] = useState<CustomVariable | null>(null);
  const [newVar, setNewVar] = useState<Partial<CustomVariable>>({
    category: 'global',
    key: '',
    value: '',
    description: '',
    data_type: 'string',
    is_sensitive: false
  });
  const [showSensitive, setShowSensitive] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      const [global, user] = await Promise.all([
        variablesApi.list('global'),
        variablesApi.list('user')
      ]);
      setGlobalVars(global);
      setUserVars(user);
    } catch (error) {
      console.error('Failed to load variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newVar.key || !newVar.value) {
      alert('Key and value are required');
      return;
    }

    try {
      if (editingVar) {
        await variablesApi.update({
          ...editingVar,
          ...newVar
        } as CustomVariable);
      } else {
        await variablesApi.create(newVar as Omit<CustomVariable, 'id'>);
      }
      await loadVariables();
      setNewVar({
        category: 'global',
        key: '',
        value: '',
        description: '',
        data_type: 'string',
        is_sensitive: false
      });
      setEditingVar(null);
    } catch (error) {
      console.error('Failed to save variable:', error);
      alert('Failed to save variable');
    }
  };

  const handleEdit = (variable: CustomVariable) => {
    setEditingVar(variable);
    setNewVar({
      category: variable.category,
      key: variable.key,
      value: variable.is_sensitive ? '' : variable.value, // Don't show sensitive values
      description: variable.description,
      data_type: variable.data_type,
      is_sensitive: variable.is_sensitive
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) return;
    
    try {
      await variablesApi.delete(id);
      await loadVariables();
    } catch (error) {
      console.error('Failed to delete variable:', error);
      alert('Failed to delete variable');
    }
  };

  const toggleShowSensitive = (id: string) => {
    setShowSensitive(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderVariableValue = (variable: CustomVariable) => {
    if (!variable.is_sensitive) {
      return <span className="font-mono text-sm">{variable.value}</span>;
    }

    const isVisible = showSensitive.has(variable.id!);
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">
          {isVisible ? variable.value : '••••••••'}
        </span>
        <button
          type="button"
          onClick={() => toggleShowSensitive(variable.id!)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  };

  const VariableTable = ({ variables, category }: { variables: CustomVariable[], category: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Variable</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {variables.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No {category} variables defined
            </TableCell>
          </TableRow>
        ) : (
          variables.map((variable) => (
            <TableRow key={variable.id}>
              <TableCell className="font-medium">{variable.key}</TableCell>
              <TableCell>{renderVariableValue(variable)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {variable.description || '-'}
              </TableCell>
              <TableCell>
                <span className="text-xs">{variable.data_type}</span>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {category === 'global' ? `{{custom.${variable.key}}}` : `{{my.${variable.key}}}`}
                </code>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(variable)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(variable.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return <div>Loading variables...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingVar ? 'Edit Variable' : 'Add Variable'}</CardTitle>
          <CardDescription>
            Create custom variables that can be used in forms, actions, and agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newVar.category}
                onValueChange={(value: 'global' | 'user') => 
                  setNewVar(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (Available to all users)</SelectItem>
                  <SelectItem value="user">Personal (Only for you)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_type">Data Type</Label>
              <Select
                value={newVar.data_type}
                onValueChange={(value) => 
                  setNewVar(prev => ({ ...prev, data_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={newVar.key}
                onChange={(e) => setNewVar(prev => ({ ...prev, key: e.target.value }))}
                placeholder="api_endpoint"
                disabled={!!editingVar}
              />
              <p className="text-xs text-muted-foreground">
                Will be used as {newVar.category === 'global' ? '{{custom.' : '{{my.'}
                {newVar.key || 'key'}{'}}'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type={newVar.is_sensitive ? 'password' : 'text'}
                value={newVar.value}
                onChange={(e) => setNewVar(prev => ({ ...prev, value: e.target.value }))}
                placeholder="https://api.example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={newVar.description}
              onChange={(e) => setNewVar(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this variable is for"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_sensitive"
              checked={newVar.is_sensitive}
              onCheckedChange={(checked) => 
                setNewVar(prev => ({ ...prev, is_sensitive: checked as boolean }))}
            />
            <Label htmlFor="is_sensitive" className="text-sm">
              Sensitive (hide value in UI)
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Plus className="h-4 w-4 mr-2" />
              {editingVar ? 'Update Variable' : 'Add Variable'}
            </Button>
            {editingVar && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingVar(null);
                  setNewVar({
                    category: 'global',
                    key: '',
                    value: '',
                    description: '',
                    data_type: 'string',
                    is_sensitive: false
                  });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Variables</CardTitle>
          <CardDescription>
            Manage your custom variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="global">Global Variables</TabsTrigger>
              <TabsTrigger value="user">Personal Variables</TabsTrigger>
            </TabsList>
            <TabsContent value="global" className="mt-4">
              <VariableTable variables={globalVars} category="global" />
            </TabsContent>
            <TabsContent value="user" className="mt-4">
              <VariableTable variables={userVars} category="user" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}