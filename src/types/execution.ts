export type ExecutionStatus = 'pending' | 'success' | 'error';

export interface ActionExecution {
  id: string;
  action_id: string;
  action_name: string;
  user_id: string;
  status: ExecutionStatus;
  request_url: string;
  request_method: string;
  request_headers?: Record<string, string>;
  request_payload?: any;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  duration_ms?: number;
  is_read: boolean;
  created_at: string;
}

export interface ExecutionListParams {
  page?: number;
  limit?: number;
  status?: ExecutionStatus;
  action_id?: string;
  unread_only?: boolean;
}

export interface ExecutionListResponse {
  executions: ActionExecution[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
}