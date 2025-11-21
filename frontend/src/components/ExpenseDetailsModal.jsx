import React from 'react';
import { Modal } from './UI';

const ExpenseDetailsModal = ({ isOpen, onClose, expense, currentUserId, getUserName }) => {
    if (!expense) return null;

    const payerName = getUserName(expense.paid_by);
    const isPayer = expense.paid_by === currentUserId;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Expense Details">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">₹</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{expense.description}</h3>
                        <p className="text-2xl font-bold text-primary-700 mt-1">₹{expense.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Added by {getUserName(expense.created_by)} on {new Date(expense.created_at).toLocaleDateString()}
                        </p>
                        {expense.groupName && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                {expense.groupName}
                            </span>
                        )}
                    </div>
                </div>

                {/* Payer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                        <span className="font-semibold">{payerName}</span> paid <span className="font-semibold">₹{expense.amount.toFixed(2)}</span>
                    </p>
                </div>

                {/* Splits Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Split Details ({expense.split_type})
                    </h4>
                    <div className="space-y-3">
                        {expense.splits.map((split, index) => {
                            const userName = getUserName(split.user_id);
                            const isMe = split.user_id === currentUserId;

                            return (
                                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                                            {userName[0]?.toUpperCase()}
                                        </div>
                                        <span className={`font-medium ${isMe ? 'text-primary-700' : 'text-gray-700'}`}>
                                            {userName} {isMe ? '(You)' : ''}
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                        ₹{split.amount.toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Notes Section */}
                {expense.notes && (
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
                        <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            {expense.notes}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ExpenseDetailsModal;
