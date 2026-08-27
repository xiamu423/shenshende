import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter, Outlet, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
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
import FavoriteCards from './pages/FavoriteCards';
import GuestFeature from './components/GuestFeature';
import { useMockData } from './contexts/MockData';
import './App.css';
import './AdaptivePageHeight.css';

function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const keepMainTabAsHistoryBoundary = () => {
      const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath !== currentPath) window.history.forward();
    };
    window.addEventListener('popstate', keepMainTabAsHistoryBoundary);
    return () => window.removeEventListener('popstate', keepMainTabAsHistoryBoundary);
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <div className="layout-content">
        <Outlet />
        <Footer />
      </div>
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
    element: <PostDetail />
  },
  {
    path: '/create-post',
    element: <ProtectedRoute><CreatePost /></ProtectedRoute>
  },
  {
    path: '/edit-post/:id',
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
    path: '/favorite-cards',
    element: <ProtectedRoute><FavoriteCards /></ProtectedRoute>
  },
  {
    path: '/edit-card/:id',
    element: <ProtectedRoute><CreateCard /></ProtectedRoute>
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/community" replace /> },
      { path: 'community', element: <Community /> },
      { path: 'chat', element: <AuthPage authenticated={<ChatList />} guest={<GuestFeature feature="聊天"/>} /> },
      { path: 'profile', element: <AuthPage authenticated={<Profile />} guest={<GuestFeature feature="个人中心"/>} /> }
    ]
  }
]);

function AuthPage({ authenticated, guest }) {
  const { isLoggedIn } = useMockData();
  return isLoggedIn ? authenticated : guest;
}

export default function App() {
  return <RouterProvider router={router} />;
}
