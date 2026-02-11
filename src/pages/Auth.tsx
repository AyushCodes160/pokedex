import { useEffect } from 'react';

export default function Auth() {
  useEffect(() => {
    window.location.href = '/auth.html';
  }, []);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <p>Redirecting to login...</p>
    </div>
  );
}
