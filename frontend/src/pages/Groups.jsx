import React, { useState, useEffect } from 'react';
import { groupsAPI, usersAPI } from '../api/api';
import { Button, Card, Modal, Input, Spinner } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const Groups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [friends, setFriends] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        fetchGroups();
        fetchFriends();
    }, []);

    const fetchGroups = async () => {
        try {
            const response = await groupsAPI.getGroups();
            setGroups(response.data);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
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

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await groupsAPI.createGroup({
                ...formData,
                members: selectedMembers,
            });
            setShowModal(false);
            setFormData({ name: '', description: '' });
            setSelectedMembers([]);
            fetchGroups();
        } catch (error) {
            console.error('Failed to create group:', error);
            alert('Failed to create group');
        }
    };

    const toggleMember = (userId) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
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
                        <h1 className="text-4xl font-extrabold text-gray-900">Groups</h1>
                        <p className="mt-2 text-gray-600">Manage your expense groups</p>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Group
                    </Button>
                </div>

                {groups.length === 0 ? (
                    <Card className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No groups</h3>
                        <p className="mt-1 text-gray-500">Get started by creating a new group</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <Card key={group.id} className="hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {group.members.length} members
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">{group.description || 'No description'}</p>
                                <div className="flex -space-x-2 mb-4">
                                    {group.member_details?.slice(0, 5).map((member, idx) => (
                                        <div
                                            key={idx}
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                                            title={member.username}
                                        >
                                            {member.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    ))}
                                    {group.members.length > 5 && (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-700 text-xs font-medium">
                                            +{group.members.length - 5}
                                        </div>
                                    )}
                                </div>
                                <a
                                    href={`/groups/${group.id}`}
                                    className="block text-center bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 rounded-lg transition-colors"
                                >
                                    View Details
                                </a>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Group">
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <Input
                            label="Group Name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Trip to Goa"
                        />
                        <Input
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add Members (Optional)
                            </label>
                            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                                {friends.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No friends to add. Add friends first!</p>
                                ) : (
                                    friends.map((friend) => (
                                        <label key={friend.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(friend.id)}
                                                onChange={() => toggleMember(friend.id)}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm">{friend.username} ({friend.email})</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Create Group
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default Groups;
