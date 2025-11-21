import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">₹</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                                SplitEase
                            </span>
                        </Link>

                        {user && (
                            <div className="hidden md:flex ml-10 space-x-4">
                                <Link
                                    to="/dashboard"
                                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/groups"
                                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Groups
                                </Link>
                                <Link
                                    to="/friends"
                                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Friends
                                </Link>
                                <Link
                                    to="/expenses"
                                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Expenses
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <span className="hidden md:block text-gray-700 font-medium">{user.username}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="hidden md:block text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                >
                                    Logout
                                </button>
                                
                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {mobileMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Mobile menu */}
                {user && mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 pb-3 pt-2">
                        <div className="flex flex-col space-y-1">
                            <Link
                                to="/dashboard"
                                onClick={closeMobileMenu}
                                className="text-gray-700 hover:bg-gray-100 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/groups"
                                onClick={closeMobileMenu}
                                className="text-gray-700 hover:bg-gray-100 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                            >
                                Groups
                            </Link>
                            <Link
                                to="/friends"
                                onClick={closeMobileMenu}
                                className="text-gray-700 hover:bg-gray-100 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                            >
                                Friends
                            </Link>
                            <Link
                                to="/expenses"
                                onClick={closeMobileMenu}
                                className="text-gray-700 hover:bg-gray-100 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                            >
                                Expenses
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-left text-gray-700 hover:bg-gray-100 hover:text-primary-600 px-3 py-2 rounded-md text-base font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
