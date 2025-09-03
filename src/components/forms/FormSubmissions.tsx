import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FormSubmission } from '@/types/form';
import { formsApi } from '@/lib/api';

interface FormSubmissionsProps {
  formId: string;
  formName: string;
  onClose: () => void;
}

export function FormSubmissions({ formId, formName, onClose }: FormSubmissionsProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, [formId]);

  const loadSubmissions = async () => {
    try {
      const data = await formsApi.getSubmissions(formId);
      setSubmissions(data.submissions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load submissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'skipped':
        return <Badge variant="secondary">No webhook</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const exportSubmissions = () => {
    const csv = [
      // Headers
      ['Submission ID', 'Submitted At', 'Webhook Status', ...Object.keys(submissions[0]?.data || {})],
      // Data rows
      ...submissions.map(sub => [
        sub.id,
        new Date(sub.created_at).toLocaleString(),
        sub.webhook_status || 'N/A',
        ...Object.values(sub.data)
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formName}-submissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Form Submissions</CardTitle>
            <CardDescription>{formName}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSubmissions}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            {submissions.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportSubmissions}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4 text-gray-500">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No submissions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        {new Date(submission.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {submission.ip_address || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.webhook_status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              ID: {selectedSubmission?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Metadata</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="font-medium">Submitted:</dt>
                  <dd>{selectedSubmission && new Date(selectedSubmission.created_at).toLocaleString()}</dd>
                  <dt className="font-medium">IP Address:</dt>
                  <dd>{selectedSubmission?.ip_address || 'N/A'}</dd>
                  <dt className="font-medium">Webhook Status:</dt>
                  <dd>{selectedSubmission?.webhook_status || 'N/A'}</dd>
                  {selectedSubmission?.webhook_response_code && (
                    <>
                      <dt className="font-medium">Response Code:</dt>
                      <dd>{selectedSubmission.webhook_response_code}</dd>
                    </>
                  )}
                  {selectedSubmission?.webhook_duration_ms && (
                    <>
                      <dt className="font-medium">Duration:</dt>
                      <dd>{selectedSubmission.webhook_duration_ms}ms</dd>
                    </>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Form Data</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(selectedSubmission?.data, null, 2)}
                  </pre>
                </div>
              </div>

              {selectedSubmission?.webhook_response && (
                <div>
                  <h3 className="font-semibold mb-2">Webhook Response</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto">
                      {selectedSubmission.webhook_response}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}