
import { Navigate, useLocation } from 'react-router-dom';

export function RequireAuth({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    const isGuest = localStorage.getItem('isGuest') === 'true';
    const location = useLocation();

    if (!token && !isGuest) {
        // Redirect to the legacy auth page
        window.location.href = '/auth.html';
        return null;
    }

    return children;
}
