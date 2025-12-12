import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import {
    Folder,
    Plus,
    User,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useState } from 'react';
import api from '../../lib/api';
import { stopTokenRefreshMonitor } from '../../lib/api';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            // Stop the refresh token monitor before logging out
            stopTokenRefreshMonitor();
            await api.post('/auth/logout', {}, {
                withCredentials: true, // Include cookies
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Ensure monitor is stopped even if logout request fails
            stopTokenRefreshMonitor();
            dispatch(logout());
            navigate('/login');
        }
    };

    if (!isAuthenticated) {
        return <>{children}</>;
    }

    const navItems = [
        { path: '/albums', label: 'Albums', icon: Folder },
        { path: '/albums/create', label: 'Create', icon: Plus },
    ];

    return (
        <div className="min-h-screen bg-[#FDF8F3]">
            {/* Navigation Bar */}
            <nav className="bg-[#8B2E3C] text-white shadow-lg sticky top-0 z-50 border-b-2 border-[#6B1F2D]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/albums" className="flex items-center space-x-2 text-xl font-bold hover:opacity-90 transition-opacity">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 shadow-md">
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#8B2E3C] border-2 border-[#6B1F2D]">
                                    <span className="text-sm font-bold text-white">M</span>
                                </div>
                            </div>
                            <span>Memory</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path === '/albums' && location.pathname.startsWith('/albums') && !location.pathname.includes('/create'));
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border-2 ${
                                            isActive
                                                ? 'bg-[#6B1F2D] border-[#4D151F] text-white shadow-md'
                                                : 'text-white border-transparent hover:bg-[#6B1F2D] hover:border-[#4D151F]'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Menu */}
                        <div className="hidden md:flex items-center space-x-3">
                            <Link
                                to="/profile"
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                            >
                                <User className="h-4 w-4" />
                                <span className="text-sm">{user?.firstName || user?.email}</span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-white hover:bg-white/10"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#6B1F2D] border-t-2 border-[#4D151F]">
                        <div className="container mx-auto px-4 py-4 space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors border-2 ${
                                            isActive
                                                ? 'bg-[#6B1F2D] border-[#4D151F] text-white shadow-md'
                                                : 'text-white border-transparent hover:bg-[#6B1F2D] hover:border-[#4D151F]'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                            <div className="pt-4 border-t border-white/10 space-y-2">
                                <Link
                                    to="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
                                >
                                    <User className="h-5 w-5" />
                                    <span>{user?.firstName || user?.email}</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center space-x-2 px-4 py-3 rounded-full text-white/90 hover:bg-white/10 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}

