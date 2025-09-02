import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AllowedDomainsInfo {
  domains: string[];
  isOpen: boolean;
  message: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, error, clearError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<AllowedDomainsInfo | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Fetch allowed domains on component mount
  useEffect(() => {
    const fetchAllowedDomains = async () => {
      try {
        const response = await api.get('/auth/allowed-domains');
        if (response.ok) {
          const data = await response.json() as AllowedDomainsInfo;
          setAllowedDomains(data);
        }
      } catch (error) {
        console.error('Failed to fetch allowed domains:', error);
      }
    };
    fetchAllowedDomains();
    
    // Check if user was just verified
    if (searchParams.get('verified') === 'true') {
      clearError();
      setVerificationError(null);
    }
  }, [searchParams, clearError]);

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setVerificationError(null);
    try {
      const response = await api.post('/auth/login', data);
      const result = await response.json();
      
      if (!response.ok) {
        if (result.requiresVerification) {
          setVerificationError(result.error);
          setResendEmail(result.email);
        } else {
          throw new Error(result.error || 'Login failed');
        }
      } else {
        await login(data.username, data.password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Error is handled in the store or above
      if (!verificationError) {
        // Let the store handle the error
        await login(data.username, data.password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    // Client-side domain validation
    if (allowedDomains && !allowedDomains.isOpen) {
      const emailDomain = data.email.toLowerCase().split('@')[1];
      const isAllowed = allowedDomains.domains.some(domain => {
        if (domain.startsWith('*.')) {
          const baseDomain = domain.substring(2);
          return emailDomain === baseDomain || emailDomain.endsWith('.' + baseDomain);
        }
        return emailDomain === domain.toLowerCase();
      });

      if (!isAllowed) {
        registerForm.setError('email', {
          type: 'manual',
          message: allowedDomains.message
        });
        return;
      }
    }

    setIsLoading(true);
    setRegistrationSuccess(false);
    try {
      const response = await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password
      });
      
      const result = await response.json();
      
      if (response.ok && result.requiresVerification) {
        setRegistrationSuccess(true);
        setResendEmail(data.email);
        registerForm.reset();
      } else if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      // Let the store handle the error
      await register(data.username, data.email, data.password);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!resendEmail) return;
    
    setResendMessage(null);
    try {
      const response = await api.post('/auth/resend-verification', { email: resendEmail });
      const result = await response.json();
      
      if (response.ok) {
        setResendMessage(result.message || 'Verification email sent!');
      } else {
        setResendMessage(result.error || 'Failed to resend email');
      }
    } catch (error) {
      setResendMessage('Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">WorkflowHub</h1>
          <p className="mt-2 text-gray-600">Simplify your workflows</p>
        </div>

        <Tabs defaultValue="login" className="w-full" onValueChange={() => clearError()}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit(onLogin)}>
                <CardContent className="space-y-4">
                  {searchParams.get('verified') === 'true' && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">
                        Email verified successfully! You can now log in.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {verificationError && (
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertDescription className="text-yellow-800">
                        {verificationError}
                        {resendEmail && (
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleResendVerification}
                            >
                              Resend Verification Email
                            </Button>
                            {resendMessage && (
                              <p className="text-sm mt-2">{resendMessage}</p>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {error && !verificationError && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      {...loginForm.register('username')}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-500">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      {...loginForm.register('password')}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  {registrationSuccess ? (
                    <span className="text-green-600">Check your email to verify your account</span>
                  ) : allowedDomains && !allowedDomains.isOpen ? (
                    <span className="text-amber-600">{allowedDomains.message}</span>
                  ) : (
                    'Get started with WorkflowHub today'
                  )}
                </CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit(onRegister)}>
                <CardContent className="space-y-4">
                  {registrationSuccess ? (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">
                        <div className="space-y-2">
                          <p>Registration successful! We've sent a verification email to {resendEmail}.</p>
                          <p>Please check your inbox and click the verification link to activate your account.</p>
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleResendVerification}
                            >
                              Resend Verification Email
                            </Button>
                            {resendMessage && (
                              <p className="text-sm mt-2">{resendMessage}</p>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      {...registerForm.register('username')}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-500">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      {...registerForm.register('email')}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-500">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Choose a password"
                      {...registerForm.register('password')}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      {...registerForm.register('confirmPassword')}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  {!registrationSuccess && (
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Register'}
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}