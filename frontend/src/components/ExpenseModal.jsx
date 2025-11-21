import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Input } from './UI';
import { expensesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const ExpenseModal = ({
    isOpen,
    onClose,
    onSuccess,
    initialGroupId = '',
    initialParticipants = [],
    groups = [],
    friends = [],
    editExpense = null,
    groupMembers = [] // default empty array
}) => {
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        group_id: initialGroupId,
        paid_by: '',
        category: 'general',
        notes: '',
        split_type: 'equal'
    });

    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [splitValues, setSplitValues] = useState({});
    const formInitialized = useRef(false);

    // Reset form when modal opens or when switching between create/edit
    useEffect(() => {
        if (isOpen && !formInitialized.current) {
            if (editExpense) {
                // Pre-populate form with existing expense data
                setFormData({
                    description: editExpense.description,
                    amount: editExpense.amount.toString(),
                    group_id: editExpense.group_id || '',
                    paid_by: editExpense.paid_by,
                    category: editExpense.category,
                    notes: editExpense.notes || '',
                    split_type: editExpense.split_type
                });
                setSelectedParticipants(editExpense.splits.map(s => s.user_id));
                // Pre-populate split values for exact/percent splits
                if (editExpense.split_type === 'exact') {
                    const values = {};
                    editExpense.splits.forEach(s => {
                        values[s.user_id] = s.amount.toString();
                    });
                    setSplitValues(values);
                } else if (editExpense.split_type === 'percent') {
                    const values = {};
                    editExpense.splits.forEach(s => {
                        const percent = (s.amount / editExpense.amount * 100).toFixed(2);
                        values[s.user_id] = percent;
                    });
                    setSplitValues(values);
                }
            } else {
                // Reset to default for new expense
                setFormData({
                    description: '',
                    amount: '',
                    group_id: initialGroupId,
                    paid_by: user?.id || '',
                    category: 'general',
                    notes: '',
                    split_type: 'equal'
                });
                // If initialParticipants provided, use them. Otherwise default to user.
                if (initialParticipants.length > 0) {
                    setSelectedParticipants(initialParticipants);
                } else if (initialGroupId) {
                    // If group selected but no participants explicitly passed, select all group members
                    const group = groups.find(g => g.id === initialGroupId);
                    if (group) {
                        setSelectedParticipants(group.members);
                    } else {
                        setSelectedParticipants([user?.id]);
                    }
                } else {
                    setSelectedParticipants([user?.id]);
                }
                setSplitValues({});
            }
            formInitialized.current = true;
        } else if (!isOpen) {
            // Reset when modal closes
            formInitialized.current = false;
        }
    }, [isOpen, editExpense, initialGroupId, initialParticipants, groups, user?.id]);


    const handleGroupChange = (groupId) => {
        setFormData({ ...formData, group_id: groupId });
        if (groupId) {
            const group = groups.find(g => g.id === groupId);
            if (group) {
                setSelectedParticipants(group.members);
                setSplitValues({});
            }
        } else {
            setSelectedParticipants([user?.id]);
        }
    };

    const handleParticipantToggle = (userId) => {
        if (selectedParticipants.includes(userId)) {
            setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
            const newValues = { ...splitValues };
            delete newValues[userId];
            setSplitValues(newValues);
        } else {
            setSelectedParticipants([...selectedParticipants, userId]);
        }
    };

    const handleSplitValueChange = (userId, value) => {
        setSplitValues({
            ...splitValues,
            [userId]: value
        });
    };

    const validateSplits = () => {
        const totalAmount = parseFloat(formData.amount);
        if (isNaN(totalAmount) || totalAmount <= 0) return "Please enter a valid amount";

        if (selectedParticipants.length === 0) return "Please select at least one participant";

        if (formData.split_type === 'exact') {
            const sum = selectedParticipants.reduce((acc, id) => acc + (parseFloat(splitValues[id]) || 0), 0);
            if (Math.abs(sum - totalAmount) > 0.01) {
                return `Total split amount(₹${sum.toFixed(2)}) must equal expense amount(₹${totalAmount.toFixed(2)})`;
            }
        } else if (formData.split_type === 'percent') {
            const sum = selectedParticipants.reduce((acc, id) => acc + (parseFloat(splitValues[id]) || 0), 0);
            if (Math.abs(sum - 100) > 0.1) {
                return `Total percentage(${sum.toFixed(1)}%) must equal 100%`;
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateSplits();
        if (error) {
            alert(error);
            return;
        }

        try {
            const totalAmount = parseFloat(formData.amount);
            let splits = [];

            if (formData.split_type === 'equal') {
                const splitAmount = totalAmount / selectedParticipants.length;
                splits = selectedParticipants.map(id => ({
                    user_id: id,
                    amount: parseFloat(splitAmount.toFixed(2))
                }));

                // Adjust last split for rounding errors
                const currentSum = splits.reduce((sum, s) => sum + s.amount, 0);
                if (currentSum !== totalAmount) {
                    splits[0].amount += (totalAmount - currentSum);
                }
            } else if (formData.split_type === 'exact') {
                splits = selectedParticipants.map(id => ({
                    user_id: id,
                    amount: parseFloat(splitValues[id] || 0)
                }));
            } else if (formData.split_type === 'percent') {
                splits = selectedParticipants.map(id => ({
                    user_id: id,
                    amount: (parseFloat(splitValues[id] || 0) / 100) * totalAmount
                }));
            }

            const expenseData = {
                ...formData,
                amount: totalAmount,
                splits
            };

            if (editExpense) {
                await expensesAPI.updateExpense(editExpense.id, expenseData);
            } else {
                await expensesAPI.createExpense(expenseData);
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create expense:', error);
            alert(error.response?.data?.detail || 'Failed to create expense');
        }
    };

    // Filter participants based on group selection
    const getAvailableParticipants = () => {
        let participants = friends;

        if (formData.group_id) {
            const group = groups.find(g => g.id === formData.group_id);
            if (group) {
                // Check if group has member_details (from getGroups API)
                if (group.member_details && group.member_details.length > 0) {
                    participants = group.member_details;
                }
                // For group expenses, return all group members (from groupMembers prop if available)
                else if (groupMembers.length > 0) {
                    participants = groupMembers.filter(m => group.members.includes(m.id));
                }
                // Fallback: return friends who are in the group
                else {
                    participants = friends.filter(f => group.members.includes(f.id));
                }
            }
        }

        // Always exclude current user to avoid duplicates with hardcoded "You" options
        return participants.filter(p => p.id !== user?.id);
    };

    const availableParticipants = getAvailableParticipants();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editExpense ? "Edit Expense" : "Add Expense"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Dinner at Taj"
                />

                <Input
                    label="Amount (₹)"
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group (Optional)
                    </label>
                    <select
                        value={formData.group_id}
                        onChange={(e) => handleGroupChange(e.target.value)}
                        className="input-field"
                        disabled={!!initialGroupId && !editExpense}
                    >
                        <option value="">No Group (Individual)</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid by
                    </label>
                    <select
                        value={formData.paid_by}
                        onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                        className="input-field"
                        required
                    >
                        <option value={user?.id}>You ({user?.username})</option>
                        {availableParticipants.map((friend) => (
                            <option key={friend.id} value={friend.id}>
                                {friend.username} ({friend.email})
                            </option>
                        ))}

                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Split Type
                    </label>
                    <div className="flex space-x-2 mb-4">
                        {['equal', 'exact', 'percent'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, split_type: type })}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize transition-colors ${formData.split_type === type
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                disabled={editExpense && editExpense.category === 'settlement'}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Split with
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                        <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <input
                                type="checkbox"
                                checked={selectedParticipants.includes(user?.id)}
                                onChange={() => handleParticipantToggle(user?.id)}
                                className="rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">You</span>
                            {formData.split_type !== 'equal' && selectedParticipants.includes(user?.id) && (
                                <input
                                    type="number"
                                    step={formData.split_type === 'percent' ? '0.1' : '0.01'}
                                    placeholder={formData.split_type === 'percent' ? '%' : '₹'}
                                    value={splitValues[user?.id] || ''}
                                    onChange={(e) => handleSplitValueChange(user?.id, e.target.value)}
                                    className="ml-auto w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            )}
                        </div>
                        {availableParticipants.map((friend) => (
                            <div key={friend.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedParticipants.includes(friend.id)}
                                    onChange={() => handleParticipantToggle(friend.id)}
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">{friend.username}</span>
                                {formData.split_type !== 'equal' && selectedParticipants.includes(friend.id) && (
                                    <input
                                        type="number"
                                        step={formData.split_type === 'percent' ? '0.1' : '0.01'}
                                        placeholder={formData.split_type === 'percent' ? '%' : '₹'}
                                        value={splitValues[friend.id] || ''}
                                        onChange={(e) => handleSplitValueChange(friend.id, e.target.value)}
                                        className="ml-auto w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    {
                        formData.split_type === 'exact' && (
                            <p className="text-xs text-right mt-1 text-gray-500">
                                Total: ₹{selectedParticipants.reduce((acc, id) => acc + (parseFloat(splitValues[id]) || 0), 0).toFixed(2)} / ₹{formData.amount || '0.00'}
                            </p>
                        )
                    }
                    {
                        formData.split_type === 'percent' && (
                            <p className="text-xs text-right mt-1 text-gray-500">
                                Total: {selectedParticipants.reduce((acc, id) => acc + (parseFloat(splitValues[id]) || 0), 0).toFixed(1)}% / 100%
                            </p>
                        )
                    }
                </div >

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {editExpense ? 'Update Expense' : 'Create Expense'}
                    </Button>
                </div>
            </form >
        </Modal >
    );
};

export default ExpenseModal;
