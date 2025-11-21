import React, { useState, useEffect } from 'react';
import { usersAPI } from '../api/api';
import { Button, Card, Modal, Input, Spinner } from '../components/UI';

const Friends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const response = await usersAPI.getFriends();
            setFriends(response.data);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await usersAPI.searchUsers(searchQuery);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Failed to search users:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddFriend = async (userId) => {
        try {
            await usersAPI.addFriend(userId);
            setShowModal(false);
            setSearchQuery('');
            setSearchResults([]);
            fetchFriends();
        } catch (error) {
            console.error('Failed to add friend:', error);
            alert('Failed to add friend');
        }
    };

    const handleRemoveFriend = async (userId) => {
        if (!confirm('Are you sure you want to remove this friend?')) return;

        try {
            await usersAPI.removeFriend(userId);
            fetchFriends();
        } catch (error) {
            console.error('Failed to remove friend:', error);
            alert('Failed to remove friend');
        }
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
                        <h1 className="text-4xl font-extrabold text-gray-900">Friends</h1>
                        <p className="mt-2 text-gray-600">Manage your connections</p>
                    </div>
                    <Button onClick={() => setShowModal(true)}>
                        <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Friend
                    </Button>
                </div>

                {friends.length === 0 ? (
                    <Card className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No friends yet</h3>
                        <p className="mt-1 text-gray-500">Start adding friends to split expenses</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {friends.map((friend) => (
                            <Card key={friend.id} className="hover:shadow-xl transition-shadow">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {friend.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900">{friend.username}</h3>
                                        <p className="text-sm text-gray-600">{friend.email}</p>
                                        {friend.full_name && (
                                            <p className="text-xs text-gray-500">{friend.full_name}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="danger"
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="w-full text-sm py-2"
                                >
                                    Remove Friend
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Friend">
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <Input
                                placeholder="Search by username or email"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} disabled={searching}>
                                {searching ? 'Searching...' : 'Search'}
                            </Button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                                                {user.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.username}</p>
                                                <p className="text-sm text-gray-600">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleAddFriend(user.id)}
                                            className="text-sm py-1 px-3"
                                            disabled={friends.some(f => f.id === user.id)}
                                        >
                                            {friends.some(f => f.id === user.id) ? 'Already Friends' : 'Add'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery && searchResults.length === 0 && !searching && (
                            <p className="text-center text-gray-500 py-4">No users found</p>
                        )}
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Friends;
