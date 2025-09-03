import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute() {
  const { user, token, verifyToken, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      verifyToken();
    }
  }, [token, user, verifyToken]);

  // If we're loading or we have a token but no user yet (refresh case), show loading
  if (isLoading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect if there's no token (logged out) or verification failed (no user after loading)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}