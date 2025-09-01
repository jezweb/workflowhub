import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Code } from 'lucide-react';
import type { HttpMethod } from '@/types/action';

interface ActionEditorProps {
  headers: Record<string, string>;
  payload: Record<string, any>;
  method: HttpMethod;
  onHeadersChange: (headers: Record<string, string>) => void;
  onPayloadChange: (payload: Record<string, any>) => void;
}

export function ActionEditor({
  headers,
  payload,
  method,
  onHeadersChange,
  onPayloadChange,
}: ActionEditorProps) {
  const [headerPairs, setHeaderPairs] = useState<Array<{ key: string; value: string }>>(
    Object.entries(headers).map(([key, value]) => ({ key, value }))
  );
  const [payloadJson, setPayloadJson] = useState(JSON.stringify(payload, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const addHeader = () => {
    const newPairs = [...headerPairs, { key: '', value: '' }];
    setHeaderPairs(newPairs);
    updateHeaders(newPairs);
  };

  const removeHeader = (index: number) => {
    const newPairs = headerPairs.filter((_, i) => i !== index);
    setHeaderPairs(newPairs);
    updateHeaders(newPairs);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newPairs = [...headerPairs];
    newPairs[index][field] = value;
    setHeaderPairs(newPairs);
    updateHeaders(newPairs);
  };

  const updateHeaders = (pairs: Array<{ key: string; value: string }>) => {
    const headersObj: Record<string, string> = {};
    pairs.forEach(pair => {
      if (pair.key) {
        headersObj[pair.key] = pair.value;
      }
    });
    onHeadersChange(headersObj);
  };

  const handlePayloadChange = (value: string) => {
    setPayloadJson(value);
    try {
      const parsed = JSON.parse(value);
      setJsonError(null);
      onPayloadChange(parsed);
    } catch (error) {
      setJsonError('Invalid JSON format');
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(payloadJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setPayloadJson(formatted);
      setJsonError(null);
    } catch (error) {
      setJsonError('Cannot format - invalid JSON');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Headers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {headerPairs.map((pair, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={pair.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Header value"
                value={pair.value}
                onChange={(e) => updateHeader(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addHeader} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Header
          </Button>
        </CardContent>
      </Card>

      {method !== 'GET' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Request Payload</CardTitle>
              <Button variant="outline" size="sm" onClick={formatJson}>
                <Code className="mr-2 h-4 w-4" />
                Format JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                value={payloadJson}
                onChange={(e) => handlePayloadChange(e.target.value)}
                placeholder='{"key": "value"}'
                className="font-mono text-sm min-h-[200px]"
                rows={10}
              />
              {jsonError && (
                <p className="text-sm text-red-500">{jsonError}</p>
              )}
              <div className="text-xs text-gray-500">
                <p>Use template variables to inject dynamic data:</p>
                <ul className="mt-1 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">{`"user_id": "{{user.id}}"`}</code></li>
                  <li>• <code className="bg-gray-100 px-1 rounded">{`"timestamp": "{{timestamp}}"`}</code></li>
                  <li>• <code className="bg-gray-100 px-1 rounded">{`"date": "{{date}}"`}</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {method === 'GET' && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">
              GET requests do not have a request body. Data should be passed via URL parameters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}