
import { Navigate, useLocation } from 'react-router-dom';

export function RequireAuth({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        // Redirect to the legacy auth page
        window.location.href = '/auth.html';
        return null;
    }

    return children;
}
