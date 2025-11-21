import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expensesAPI, groupsAPI } from '../api/api';
import { Card, Button, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import SettleUpModal from '../components/SettleUpModal';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [balances, setBalances] = useState(null);
    const [settleUpDebt, setSettleUpDebt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const response = await expensesAPI.getBalanceSummary();
            setBalances(response.data);
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const totalOwed = Math.abs(balances?.total_owed || 0);
    const totalOwedToMe = balances?.total_owed_to_me || 0;
    const netBalance = totalOwedToMe - totalOwed;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        Welcome back, <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">{user?.username}!</span>
                    </h1>
                    <p className="mt-2 text-gray-600">Here's your expense overview</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-600">You owe</p>
                                <p className="mt-2 text-3xl font-bold text-red-700">₹{totalOwed.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-red-500 rounded-full">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">You are owed</p>
                                <p className="mt-2 text-3xl font-bold text-green-700">₹{totalOwedToMe.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-green-500 rounded-full">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className={`bg-gradient-to-br ${netBalance >= 0 ? 'from-primary-50 to-primary-100 border-l-4 border-primary-500' : 'from-orange-50 to-orange-100 border-l-4 border-orange-500'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net Balance</p>
                                <p className={`mt-2 text-3xl font-bold ${netBalance >= 0 ? 'text-primary-700' : 'text-orange-700'}`}>
                                    ₹{Math.abs(netBalance).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {netBalance >= 0 ? 'In your favor' : 'You owe overall'}
                                </p>
                            </div>
                            <div className={`w-14 h-14 ${netBalance >= 0 ? 'bg-primary-500' : 'bg-orange-500'} rounded-full flex items-center justify-center`}>
                                <span className="text-2xl font-bold text-white">=</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Individual Balances</h2>
                        {balances && balances.debts && balances.debts.length > 0 ? (
                            <div className="space-y-3">
                                {balances.debts.map((debt, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                                                U
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-700">{debt.username}</p>
                                                <p className="text-xs text-gray-500">{debt.group_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className={`font-bold ${debt.type === 'owed' ? 'text-green-600' : 'text-red-600'}`}>
                                                {debt.type === 'owed' ? '+' : ''}₹{debt.amount.toFixed(2)}
                                            </span>
                                            <Button
                                                onClick={() => setSettleUpDebt(debt)}
                                                variant="secondary"
                                                className="text-xs px-3 py-1"
                                            >
                                                Settle Up
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No balances to show</p>
                        )}
                    </Card>

                    <Card>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <a
                                href="/expenses"
                                className="block p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="font-semibold">Add Expense</span>
                                </div>
                            </a>
                            <a
                                href="/groups"
                                className="block p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="font-semibold">Create Group</span>
                                </div>
                            </a>
                            <a
                                href="/friends"
                                className="block p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    <span className="font-semibold">Add Friends</span>
                                </div>
                            </a>
                        </div>
                    </Card>
                </div>
            </div>

            <SettleUpModal
                isOpen={!!settleUpDebt}
                onClose={() => setSettleUpDebt(null)}
                debt={settleUpDebt}
                onSuccess={fetchBalances}
            />
        </div>
    );
};

export default Dashboard;
