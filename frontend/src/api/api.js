import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
    searchUsers: (query) => api.get(`/users/search?query=${query}`),
    getFriends: () => api.get('/users/friends'),
    addFriend: (userId) => api.post(`/users/friends/${userId}`),
    removeFriend: (userId) => api.delete(`/users/friends/${userId}`),
};

// Groups
export const groupsAPI = {
    getGroups: () => api.get('/groups/'),
    getGroup: (id) => api.get(`/groups/${id}`),
    createGroup: (data) => api.post('/groups/', data),
    updateGroup: (id, data) => api.put(`/groups/${id}`, data),
    deleteGroup: (id) => api.delete(`/groups/${id}`),
    addMember: (id, userId) => api.post(`/groups/${id}/members`, { user_id: userId }),
    getGroupBalances: (id) => api.get(`/groups/${id}/balances`),
};

// Expenses
export const expensesAPI = {
    getExpenses: (groupId, skip = 0, limit = 10) => {
        const params = { skip, limit };
        if (groupId) {
            params.group_id = groupId;
        }
        return api.get('/expenses/', { params });
    },
    getExpenseSummary: (groupId) => {
        const params = {};
        if (groupId) {
            params.group_id = groupId;
        }
        return api.get('/expenses/summary', { params });
    },
    getExpense: (id) => api.get(`/expenses/${id}`),
    createExpense: (data) => api.post('/expenses/', data),
    updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
    deleteExpense: (id) => api.delete('/expenses/' + id),
    getBalanceSummary: () => api.get('/expenses/balances/summary'),
};
export default api;
