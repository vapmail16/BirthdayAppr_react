import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const AdminRoute = ({ children }) => {
    const { userRole, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    return userRole === 'admin' ? children : <Navigate to="/" />;
};

export default AdminRoute; 