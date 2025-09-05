import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { storageApi } from '@/lib/api';
import { BucketList } from '@/components/storage/BucketList';
import { BucketForm } from '@/components/storage/BucketForm';
import { Plus, HardDrive } from 'lucide-react';
import type { StorageBucket, CreateBucketInput, UpdateBucketInput } from '@/types/storage';

export function Storage() {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBucketForm, setShowBucketForm] = useState(false);
  const [editingBucket, setEditingBucket] = useState<StorageBucket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      const response = await storageApi.listBuckets();
      setBuckets(response.buckets || []);
    } catch (error) {
      console.error('Failed to load buckets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load storage buckets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateBucketInput) => {
    try {
      await storageApi.createBucket(data);
      toast({
        title: 'Success',
        description: 'Storage bucket created successfully',
      });
      setShowBucketForm(false);
      loadBuckets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bucket',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: UpdateBucketInput) => {
    if (!editingBucket) return;
    
    try {
      await storageApi.updateBucket(editingBucket.id, data);
      toast({
        title: 'Success',
        description: 'Storage bucket updated successfully',
      });
      setEditingBucket(null);
      loadBuckets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bucket',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bucket?')) return;

    try {
      await storageApi.deleteBucket(id);
      toast({
        title: 'Success',
        description: 'Storage bucket deleted successfully',
      });
      loadBuckets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bucket',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (id: string) => {
    try {
      const response = await storageApi.testConnection(id);
      toast({
        title: response.success ? 'Success' : 'Failed',
        description: response.message || 'Connection test completed',
        variant: response.success ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Connection test failed',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (bucket: StorageBucket) => {
    setEditingBucket(bucket);
    setShowBucketForm(true);
  };

  const handleCloseForm = () => {
    setShowBucketForm(false);
    setEditingBucket(null);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="h-6 w-6" />
              <div>
                <CardTitle>Storage Buckets</CardTitle>
                <CardDescription>
                  Manage your storage buckets across different providers
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowBucketForm(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Bucket
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading buckets...
            </div>
          ) : buckets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No storage buckets configured yet.
              </p>
              <Button onClick={() => setShowBucketForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Bucket
              </Button>
            </div>
          ) : (
            <BucketList
              buckets={buckets}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTest={handleTest}
            />
          )}
        </CardContent>
      </Card>

      {showBucketForm && (
        <BucketForm
          bucket={editingBucket}
          onSubmit={editingBucket ? handleUpdate : handleCreate}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}