import React, { useState } from 'react';
import { Button, Modal, Input } from './UI';
import { expensesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const SettleUpModal = ({ isOpen, onClose, onSuccess, debt }) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState(debt?.amount?.toFixed(2) || '');
    const [loading, setLoading] = useState(false);

    const handleSettle = async (e) => {
        e.preventDefault();

        const settlementAmount = parseFloat(amount);
        if (isNaN(settlementAmount) || settlementAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            // Create an expense that represents the settlement
            // If debt.type is 'owe', current user pays the other person
            // If debt.type is 'owed', the other person pays current user
            const paidBy = debt.type === 'owe' ? user.id : debt.user_id;
            const receiverId = debt.type === 'owe' ? debt.user_id : user.id;

            await expensesAPI.createExpense({
                description: `Settlement payment`,
                amount: settlementAmount,
                paid_by: paidBy,
                group_id: debt.group_id || '',
                category: 'settlement',
                notes: `Settlement in ${debt.group_name}`,
                splits: [
                    {
                        user_id: receiverId,
                        amount: settlementAmount
                    }
                ]
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to settle up:', error);
            alert(error.response?.data?.detail || 'Failed to record settlement');
        } finally {
            setLoading(false);
        }
    };

    if (!debt) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settle Up">
            <form onSubmit={handleSettle} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                        {debt.type === 'owe' ? 'You owe' : 'You are owed'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                        {debt.username}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{debt.group_name}</p>
                    <p className="text-xl font-semibold text-primary-600 mt-2">
                        ₹{debt.amount.toFixed(2)}
                    </p>
                </div>

                <Input
                    label="Settlement Amount (₹)"
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        {debt.type === 'owe'
                            ? `Recording that you paid ₹${amount || '0.00'} to ${debt.username}`
                            : `Recording that ${debt.username} paid you ₹${amount || '0.00'}`
                        }
                    </p>
                </div>

                <div className="flex space-x-3 mt-6">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? 'Recording...' : 'Record Payment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SettleUpModal;
