import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { api } from '@/lib/api';

export function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.post('/auth/verify-email', { token: verificationToken });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login?verified=true'), 3000);
      } else {
        if (data.error?.includes('expired')) {
          setStatus('expired');
          setEmail(data.email || '');
        } else {
          setStatus('error');
        }
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    try {
      const response = await api.post('/auth/resend-verification', { email });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Verification email sent!');
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage('Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            Verify your email address to access WorkflowHub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting to login...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {message}
                </AlertDescription>
              </Alert>
              <Button 
                className="mt-4"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
          
          {status === 'expired' && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  {message}
                </AlertDescription>
              </Alert>
              {email && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Would you like to resend the verification email?
                  </p>
                  <Button onClick={resendVerification}>
                    Resend Verification Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}