import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, expensesAPI, usersAPI } from '../api/api';
import ExpenseModal from '../components/ExpenseModal';
import ExpenseDetailsModal from '../components/ExpenseDetailsModal';
import { Button, Card, Modal, Input, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const GroupDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showSettleUpModal, setShowSettleUpModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState('');
    const [settleUpData, setSettleUpData] = useState({ payer: '', payee: '', amount: '' });
    const [balances, setBalances] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [myExpenses, setMyExpenses] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedExpense, setSelectedExpense] = useState(null);

    useEffect(() => {
        fetchGroupDetails();
        fetchExpenses(true);
        fetchExpenseSummary();
        fetchFriends();
        fetchBalances();
    }, [id]);



    // Set default payer to current user when modal opens
    useEffect(() => {
        if (showSettleUpModal && user) {
            setSettleUpData(prev => ({ ...prev, payer: user.id }));
        }
    }, [showSettleUpModal, user]);

    const fetchGroupDetails = async () => {
        try {
            const response = await groupsAPI.getGroup(id);
            setGroup(response.data);

            // Fetch member details
            const memberPromises = response.data.members.map(async (memberId) => {
                // If member is current user, return user details directly
                if (user && memberId === user.id) {
                    return { ...user, id: user.id };
                }

                try {
                    const userResponse = await usersAPI.searchUsers('');
                    const memberUser = userResponse.data.find(u => u.id === memberId);
                    return memberUser || { id: memberId, username: 'User', email: '' };
                } catch {
                    return { id: memberId, username: 'User', email: '' };
                }
            });

            const memberDetails = await Promise.all(memberPromises);
            setMembers(memberDetails);
        } catch (error) {
            console.error('Failed to fetch group:', error);
            navigate('/groups');
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async (initialLoad = true) => {
        try {
            if (initialLoad) {
                const response = await expensesAPI.getExpenses(id, 0, 10);
                setExpenses(response.data.expenses);
                setSkip(10);
                setHasMore(response.data.expenses.length === 10 && 10 < response.data.total_count);
            } else {
                setLoadingMore(true);
                const response = await expensesAPI.getExpenses(id, skip, 10);
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
            const response = await expensesAPI.getExpenseSummary(id);
            setTotalExpenses(response.data.total_expenses);
            setMyExpenses(response.data.my_expenses);
            setTotalCount(response.data.total_count || 0);
        } catch (error) {
            console.error('Failed to fetch expense summary:', error);
        }
    };

    const fetchFriends = async () => {
        try {
            const response = await usersAPI.getFriends();
            setFriends(response.data);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    };

    const fetchBalances = async () => {
        try {
            const response = await groupsAPI.getGroupBalances(id);
            setBalances(response.data.balances);
            setSettlements(response.data.settlements);
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedFriend) return;

        try {
            await groupsAPI.addMember(id, selectedFriend);
            setShowAddMemberModal(false);
            setSelectedFriend('');
            fetchGroupDetails();
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member');
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
            fetchBalances();
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('Failed to delete expense');
        }
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    const handleSettleUp = async (e) => {
        e.preventDefault();
        try {
            await expensesAPI.createExpense({
                description: 'Settlement payment',
                amount: parseFloat(settleUpData.amount),
                paid_by: settleUpData.payer,
                group_id: id,
                split_type: 'exact',
                category: 'settlement',
                notes: `Settlement in ${group.name}`,
                splits: [{
                    user_id: settleUpData.payee,
                    amount: parseFloat(settleUpData.amount)
                }]
            });
            setShowSettleUpModal(false);
            setSettleUpData({ payer: '', payee: '', amount: '' });
            fetchExpenses();
            fetchBalances();
        } catch (error) {
            console.error('Failed to settle up:', error);
            alert('Failed to settle up');
        }
    };

    const handleExpenseSuccess = () => {
        setSkip(0);
        setHasMore(true);
        fetchExpenses(true);
        fetchExpenseSummary();
        fetchBalances();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/groups')}
                        className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Groups
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900">{group.name}</h1>
                            {group.description && (
                                <p className="mt-2 text-gray-600">{group.description}</p>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="secondary" onClick={() => setShowSettleUpModal(true)}>
                                Settle Up
                            </Button>
                            <Button onClick={() => setShowExpenseModal(true)}>
                                <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Expense
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-l-4 border-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary-600">Total Expenses</p>
                                <p className="mt-2 text-3xl font-bold text-primary-700">₹{totalExpenses.toFixed(2)}</p>
                            </div>
                            <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">₹</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">My Expenses</p>
                                <p className="mt-2 text-3xl font-bold text-orange-700">₹{myExpenses.toFixed(2)}</p>
                            </div>
                            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">₹</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Total Members</p>
                                <p className="mt-2 text-3xl font-bold text-purple-700">{members.length}</p>
                            </div>
                            <div className="p-3 bg-purple-500 rounded-full">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Number of Expenses</p>
                                <p className="mt-2 text-3xl font-bold text-green-700">{totalCount}</p>
                            </div>
                            <div className="p-3 bg-green-500 rounded-full">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Members Section */}
                    <div className="lg:col-span-1">
                        <Card>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                                <button
                                    onClick={() => setShowAddMemberModal(true)}
                                    className="text-primary-600 hover:text-primary-700"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            <div className="space-y-3">
                                {members.map((member) => {
                                    const balance = balances[member.id] || 0;
                                    const isPositive = balance > 0.01;
                                    const isNegative = balance < -0.01;
                                    const isCurrentUser = member.id === user?.id;

                                    return (
                                        <div
                                            key={member.id}
                                            className={`flex items-center space-x-3 p-3 rounded-lg ${isCurrentUser ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${isCurrentUser ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-400 to-primary-600'
                                                }`}>
                                                {isCurrentUser ? 'Y' : (member.username?.[0]?.toUpperCase() || 'U')}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${isCurrentUser ? 'text-primary-900' : 'text-gray-900'}`}>
                                                    {isCurrentUser ? `You (${member.username})` : member.username}
                                                </p>
                                                {member.email && (
                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                )}
                                            </div>
                                            {(isPositive || isNegative) && (
                                                <div className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPositive ? '+' : ''}₹{balance.toFixed(2)}
                                                </div>
                                            )}
                                            {!isPositive && !isNegative && (
                                                <div className="text-sm text-gray-400">
                                                    settled
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    {/* Expenses Section */}
                    <div className="lg:col-span-2">
                        <Card>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Expenses</h2>
                            {expenses.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">No expenses yet</h3>
                                    <p className="mt-1 text-gray-500">Get started by adding your first expense</p>
                                    <Button onClick={() => setShowExpenseModal(true)} className="mt-4">
                                        Add Expense
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {expenses.map((expense) => (
                                        <div
                                            key={expense.id}
                                            className={`p-4 rounded-lg transition-colors cursor-pointer ${expense.category === 'settlement'
                                                ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => setSelectedExpense(expense)}
                                        >
                                            <div className="flex justify-between items-start">
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
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {expense.category} • {new Date(expense.created_at).toLocaleDateString()}
                                                    </p>
                                                    {expense.notes && (
                                                        <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                                                    )}
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                                            Split: {expense.split_type}
                                                        </span>
                                                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                                                            {expense.splits.length} participants
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-2xl font-bold text-primary-700">₹{expense.amount.toFixed(2)}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Paid by {expense.paid_by === user?.id ? 'You' : (members.find(m => m.id === expense.paid_by)?.username || 'User')}
                                                    </p>
                                                    {expense.category !== 'settlement' && (
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
                                        </div>
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
                        </Card>
                    </div>
                </div>

                {/* Add Member Modal */}
                <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Add Member">
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Friend
                            </label>
                            <select
                                value={selectedFriend}
                                onChange={(e) => setSelectedFriend(e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="">Choose a friend...</option>
                                {friends
                                    .filter(friend => !group.members.includes(friend.id))
                                    .map((friend) => (
                                        <option key={friend.id} value={friend.id}>
                                            {friend.username} ({friend.email})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button type="button" variant="secondary" onClick={() => setShowAddMemberModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Add Member
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Settle Up Modal */}
                <Modal isOpen={showSettleUpModal} onClose={() => setShowSettleUpModal(false)} title="Settle Up">
                    <form onSubmit={handleSettleUp} className="space-y-4">
                        {settlements.length > 0 && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3">Suggested Settlements:</h3>
                                <div className="space-y-2">
                                    {settlements.map((settlement, index) => {
                                        const fromMember = members.find(m => m.id === settlement.from);
                                        const toMember = members.find(m => m.id === settlement.to);
                                        return (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    setSettleUpData({
                                                        payer: settlement.from,
                                                        payee: settlement.to,
                                                        amount: settlement.amount.toString()
                                                    });
                                                }}
                                                className="w-full text-left p-3 bg-white hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                                            >
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-semibold">{fromMember?.username || 'User'}</span>
                                                    {' → '}
                                                    <span className="font-semibold">{toMember?.username || 'User'}</span>
                                                </p>
                                                <p className="text-lg font-bold text-primary-600">₹{settlement.amount.toFixed(2)}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-blue-700 mt-2">Click a suggestion to auto-fill the form</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payer (Who paid?)
                            </label>
                            <select
                                value={settleUpData.payer}
                                onChange={(e) => setSettleUpData({ ...settleUpData, payer: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="">Select payer...</option>
                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.username} {member.id === user?.id ? '(You)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payee (To whom?)
                            </label>
                            <select
                                value={settleUpData.payee}
                                onChange={(e) => setSettleUpData({ ...settleUpData, payee: e.target.value })}
                                className="input-field"
                                required
                            >
                                <option value="">Select recipient...</option>
                                {members
                                    .filter(m => m.id !== settleUpData.payer)
                                    .map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.username} {member.id === user?.id ? '(You)' : ''}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <Input
                            label="Amount (₹)"
                            type="number"
                            step="0.01"
                            required
                            value={settleUpData.amount}
                            onChange={(e) => setSettleUpData({ ...settleUpData, amount: e.target.value })}
                            placeholder="0.00"
                        />

                        <div className="flex space-x-3 mt-6">
                            <Button type="button" variant="secondary" onClick={() => setShowSettleUpModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Settle Up
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Expense Modal */}
                {showExpenseModal && (
                    <ExpenseModal
                        isOpen={showExpenseModal}
                        onClose={() => {
                            setShowExpenseModal(false);
                            setEditingExpense(null);
                        }}
                        onSuccess={handleExpenseSuccess}
                        initialGroupId={id}
                        groups={[group]}
                        friends={friends}
                        editExpense={editingExpense}
                        groupMembers={members}
                    />
                )}

                <ExpenseDetailsModal
                    isOpen={!!selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    expense={selectedExpense ? { ...selectedExpense, groupName: group.name } : null}
                    currentUserId={user?.id}
                    getUserName={(userId) => {
                        if (userId === user?.id) return 'You';
                        return members.find(m => m.id === userId)?.username || 'User';
                    }}
                />
            </div>
        </div>
    );
};

export default GroupDetails;
