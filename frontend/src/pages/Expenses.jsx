import React, { useState, useEffect } from 'react';
import { expensesAPI, groupsAPI, usersAPI } from '../api/api';
import { Button, Card, Modal, Input, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';

const Expenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [groups, setGroups] = useState([]);
    const [friends, setFriends] = useState([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [myTotalExpenses, setMyTotalExpenses] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchData(true);
    }, []);

    const fetchData = async (initialLoad = true) => {
        try {
            const [groupsRes, friendsRes] = await Promise.all([
                groupsAPI.getGroups(),
                usersAPI.getFriends()
            ]);
            setGroups(groupsRes.data);
            setFriends(friendsRes.data);

            if (initialLoad) {
                await fetchExpenses(true);
                await fetchExpenseSummary();
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async (initialLoad = true) => {
        try {
            if (initialLoad) {
                const response = await expensesAPI.getExpenses(null, 0, 10);
                setExpenses(response.data.expenses);
                setSkip(10);
                setHasMore(response.data.expenses.length === 10 && 10 < response.data.total_count);
            } else {
                setLoadingMore(true);
                const response = await expensesAPI.getExpenses(null, skip, 10);
                setExpenses(prev => [...prev, ...response.data.expenses]);
                setSkip(prev => prev + response.data.expenses.length);
                setHasMore(skip + response.data.expenses.length < response.data.total_count);
                setLoadingMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
            setLoadingMore(false);
        }
    };

    const fetchExpenseSummary = async () => {
        try {
            const response = await expensesAPI.getExpenseSummary(null);
            setMyTotalExpenses(response.data.my_expenses);
            setTotalCount(response.data.total_count || 0);
        } catch (error) {
            console.error('Failed to fetch expense summary:', error);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            await expensesAPI.deleteExpense(expenseId);
            setSkip(0);
            setHasMore(true);
            fetchExpenses(true);
            fetchExpenseSummary();
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('Failed to delete expense');
        }
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    const getParticipantName = (id) => {
        if (id === user?.id) return 'You';
        const friend = friends.find(f => f.id === id);
        if (friend) return friend.username;
        // Try to find in groups if not in friends (for group members who aren't friends)
        for (const group of groups) {
            if (group.members.includes(id)) {
                // We don't have usernames for non-friend group members in this state structure easily
                // In a real app, we'd fetch user details or have them in the group object
                return 'User';
            }
        }
        return 'Unknown';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Expenses</h1>
                        <p className="mt-2 text-gray-600">Track and manage your expenses</p>
                    </div>
                    <Button onClick={() => setShowExpenseModal(true)}>
                        <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Expense
                    </Button>
                </div>

                {/* My Expenses Stats Card */}
                <div className="mb-6">
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">My Total Expenses</p>
                                <p className="mt-2 text-3xl font-bold text-orange-700">₹{myTotalExpenses.toFixed(2)}</p>
                                <p className="mt-1 text-xs text-orange-500">{totalCount} expense{totalCount !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">₹</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {expenses.length === 0 ? (
                    <Card className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No expenses</h3>
                        <p className="mt-1 text-gray-500">Get started by adding your first expense</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {expenses.map((expense) => (
                            <Card
                                key={expense.id}
                                className={`transition-shadow cursor-pointer ${expense.category === 'settlement'
                                    ? 'bg-blue-50 hover:shadow-xl border-l-4 border-blue-400'
                                    : 'hover:shadow-xl'
                                    }`}
                                onClick={() => setSelectedExpense(expense)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${expense.category === 'settlement'
                                                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                                : 'bg-gradient-to-br from-primary-400 to-primary-600'
                                                }`}>
                                                <span className="text-xl font-bold text-white">₹</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`text-lg font-bold ${expense.category === 'settlement' ? 'text-blue-900' : 'text-gray-900'
                                                    }`}>
                                                    {expense.description}
                                                    {expense.category === 'settlement' && (
                                                        <span className="ml-2 text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                                                            Settlement
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {expense.category} • {new Date(expense.created_at).toLocaleDateString()}
                                                </p>
                                                {expense.notes && (
                                                    <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                                                )}
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                                        Split: {expense.split_type}
                                                    </span>
                                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                        {expense.splits.length} participants
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="text-2xl font-bold text-primary-700">₹{expense.amount.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600">
                                            Paid by {getParticipantName(expense.paid_by)}
                                        </p>
                                        {expense.category !== 'settlement' && (
                                            expense.paid_by === user?.id || expense.splits.some(s => s.user_id === user?.id)
                                        ) && (
                                                <div className="flex gap-2 mt-2 justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditExpense(expense);
                                                        }}
                                                        className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExpense(expense.id);
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {/* Load More button */}
                        {hasMore && (
                            <div className="p-4 text-center">
                                <Button
                                    onClick={() => fetchExpenses(false)}
                                    disabled={loadingMore}
                                    className="w-full sm:w-auto"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Spinner className="inline w-4 h-4 mr-2" />
                                            Loading...
                                        </>
                                    ) : (
                                        `Load More (${expenses.length} of ${totalCount})`
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {showExpenseModal && (
                    <ExpenseModal
                        isOpen={showExpenseModal}
                        onClose={() => {
                            setShowExpenseModal(false);
                            setEditingExpense(null);
                        }}
                        onSuccess={() => {
                            setSkip(0);
                            setHasMore(true);
                            fetchExpenses(true);
                            fetchExpenseSummary();
                        }}
                        editExpense={editingExpense}
                        groups={groups}
                        friends={friends}
                    />
                )}

                <ExpenseDetailsModal
                    isOpen={!!selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    expense={selectedExpense ? {
                        ...selectedExpense,
                        groupName: groups.find(g => g.id === selectedExpense.group_id)?.name
                    } : null}
                    currentUserId={user?.id}
                    getUserName={getParticipantName}
                />
            </div>
        </div>
    );
};

export default Expenses;
