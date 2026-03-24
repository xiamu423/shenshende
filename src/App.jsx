import { RouterProvider, createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Community from './pages/Community';
import ChatList from './pages/ChatList';
import Profile from './pages/Profile';
import Login from './pages/Login';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import ChatDetail from './pages/ChatDetail';
import MyPosts from './pages/MyPosts';
import MyCards from './pages/MyCards';
import CreateCard from './pages/CreateCard';
import { useMockData } from './contexts/MockData';
import './App.css';

function MainLayout() {
  const { isLoggedIn } = useMockData();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
}

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useMockData();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/post/:id',
    element: <ProtectedRoute><PostDetail /></ProtectedRoute>
  },
  {
    path: '/create-post',
    element: <ProtectedRoute><CreatePost /></ProtectedRoute>
  },
  {
    path: '/chat/:id',
    element: <ProtectedRoute><ChatDetail /></ProtectedRoute>
  },
  {
    path: '/my-posts',
    element: <ProtectedRoute><MyPosts /></ProtectedRoute>
  },
  {
    path: '/my-cards',
    element: <ProtectedRoute><MyCards /></ProtectedRoute>
  },
  {
    path: '/create-card',
    element: <ProtectedRoute><CreateCard /></ProtectedRoute>
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/community" replace /> },
      { path: 'community', element: <Community /> },
      { path: 'chat', element: <ChatList /> },
      { path: 'profile', element: <Profile /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
