import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserInformation() {
    const [userRegisterData, setUserRegisterData] = useState({ username: '', password: '', role: '' });
    const [adminRegisterData, setAdminRegisterData] = useState({ username: '', password: '', phoneno: '', fullname: '' });
    const [nameOptions, setNameOptions] = useState([]);

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [registeringUser, setRegisteringUser] = useState(false);
    const [registeringAdmin, setRegisteringAdmin] = useState(false);

    const [showPasswords, setShowPasswords] = useState({});
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editData, setEditData] = useState({ username: '', password: '', role: '' });

    const handleUserRegister = async () => {
        setRegisteringUser(true);
        try {
            await axios.post('https://vss-server.vercel.app/user', userRegisterData);
            alert('User registered successfully');
            fetchUsers();
        } catch (err) {
            alert('Registration failed');
        } finally {
            setRegisteringUser(false);
        }
    };

    const handleAdminRegister = async () => {
        setRegisteringAdmin(true);
        try {
            await axios.post('https://vss-server.vercel.app/admin', adminRegisterData);
            alert('Admin registered successfully');
        } catch (err) {
            alert('Admin registration failed');
        } finally {
            setRegisteringAdmin(false);
        }
    };

    const handleEditSubmit = async (id) => {
        try {
            await axios.put(`https://vss-server.vercel.app/user/${id}`, editData);
            setUsers(prev => prev.map(user => (user._id === id ? { ...user, ...editData } : user)));
            setEditingUserId(null);
        } catch (err) {
            alert("Update failed");
        }
    };

    const handleDeleteUser = async (id) => {
        setDeletingUserId(id);
        try {
            await axios.delete(`https://vss-server.vercel.app/user/${id}`);
            setUsers(prev => prev.filter(user => user._id !== id));
        } catch (err) {
            alert("Delete failed");
        } finally {
            setDeletingUserId(null);
        }
    };

    const fetchUsers = () => {
        setLoadingUsers(true);
        fetch('https://vss-server.vercel.app/user')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error('Error fetching users:', err))
            .finally(() => setLoadingUsers(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axios.get('https://vss-server.vercel.app/get-forms');
                const nameFieldObj = response.data.find(form =>
                    form.inputFields.some(field => field.label === "Name Of Concern VI")
                );
                const options = nameFieldObj?.inputFields.find(field => field.label === "Name Of Concern VI")?.fields || [];
                setNameOptions(options);
            } catch (err) {
                console.error('Error fetching forms:', err);
            }
        };

        fetchForms();
    }, []);
    const [searchName, setSearchName] = useState('');
    const [searchRole, setSearchRole] = useState('');
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchName.toLowerCase()) &&
        user.role.toLowerCase().includes(searchRole.toLowerCase())
    );

    return (
        <div className="mb-4 p-2" style={{ height: '93vh', overflow: 'scroll' }}>


            <div className="dropdown">
                <button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fa-solid fa-id-card fa-lg me-2"></i>Register
                </button>
                <ul className="dropdown-menu">
                    <li>
                        <button className="dropdown-item" data-bs-toggle="collapse" data-bs-target="#collapseUserRegister">User Registration</button>
                    </li>
                    <li>
                        <button className="dropdown-item" data-bs-toggle="collapse" data-bs-target="#collapseAdminRegister">Admin Registration</button>
                    </li>
                </ul>
            </div>

            {/* User Registration Collapse */}
            <div className="collapse mt-3" id="collapseUserRegister">
                <div className="card card-body">
                    <select className="form-select mb-2" onChange={e => setUserRegisterData({ ...userRegisterData, username: e.target.value })}>
                        <option value="">Select Username</option>
                        {nameOptions.map(name => (
                            <option key={name._id} value={name.label}>{name.label}</option>
                        ))}
                    </select>
                    <input type="password" className="form-control mb-2" placeholder="Password"
                        onChange={e => setUserRegisterData({ ...userRegisterData, password: e.target.value })} />
                    <select className="form-select mb-2" onChange={e => setUserRegisterData({ ...userRegisterData, role: e.target.value })}>
                        <option value="">Select Role</option>
                        <option value="Preventive Check Decoy Check Complaint">Preventive Check | Decoy Check | Complaint</option>
                        <option value="DAR Action">DAR Action</option>
                    </select>
                    <button className="btn btn-success" style={{ width: 'fit-content' }} onClick={handleUserRegister} disabled={registeringUser}>
                        {registeringUser ? (<><span className="spinner-border spinner-border-sm me-2"></span>Registering...</>) : "Register"}
                    </button>
                </div>
            </div>

            {/* Admin Registration Collapse */}
            <div className="collapse mt-3" id="collapseAdminRegister">
                <div className="card card-body">
                    <select className="form-select mb-2" onChange={e => setAdminRegisterData({ ...adminRegisterData, username: e.target.value })}>
                        <option value="">Select Username</option>
                        {nameOptions.map(name => (
                            <option key={name._id} value={name.label}>{name.label}</option>
                        ))}
                    </select>
                    <input type="password" className="form-control mb-2" placeholder="Password"
                        onChange={e => setAdminRegisterData({ ...adminRegisterData, password: e.target.value })} />
                    <input className="form-control mb-2" placeholder="Phone No"
                        onChange={e => setAdminRegisterData({ ...adminRegisterData, phoneno: e.target.value })} />
                    <input className="form-control mb-2" placeholder="Full Name"
                        onChange={e => setAdminRegisterData({ ...adminRegisterData, fullname: e.target.value })} />
                    <button className="btn btn-dark" style={{ width: 'fit-content' }} onClick={handleAdminRegister} disabled={registeringAdmin}>
                        {registeringAdmin ? (<><span className="spinner-border spinner-border-sm me-2"></span>Registering...</>) : "Register"}
                    </button>
                </div>
            </div>

            <div className="row g-2 mb-3 mt-2">
                <div className="col-md-6">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by username"
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                    />
                </div>
                <div className="col-md-6">
                    <select
                        className="form-select"
                        value={searchRole}
                        onChange={e => setSearchRole(e.target.value)}
                    >
                        <option value="">Search by role</option>
                        <option value="Preventive Check Decoy Check Complaint">Preventive Check | Decoy Check | Complaint</option>
                        <option value="DAR Action">DAR Action</option>
                    </select>
                </div>
            </div>

            {/* All User List */}
            <div className="mt-4">
                {loadingUsers ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <div key={user._id} className="Users-Information shadow-sm mb-3 p-3 rounded border">
                            <div className="user">
                                {editingUserId === user._id ? (
                                    <>
                                        <div className="mb-2">
                                            <label className="form-label fw-bold">Username</label>
                                            <select className="form-select" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })}>
                                                <option value="">Select Username</option>
                                                {nameOptions.map(name => (
                                                    <option key={name._id} value={name.label}>{name.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-2">
                                            <label className="form-label fw-bold">Password</label>
                                            <input type="password" className="form-control" value={editData.password}
                                                onChange={e => setEditData({ ...editData, password: e.target.value })} />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Role</label>
                                            <select className="form-select" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })}>
                                                <option value="">Select Role</option>
                                                <option value="Preventive Check Decoy Check Complaint">Preventive Check | Decoy Check | Complaint</option>
                                                <option value="DAR Action">DAR Action</option>
                                            </select>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <button className="btn btn-primary" onClick={() => handleEditSubmit(user._id)}>Save</button>
                                            <button className="btn btn-secondary" onClick={() => setEditingUserId(null)}>Cancel</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-2">
                                            <label className="form-label fw-bold">Username</label>
                                            <input type="text" className="form-control" value={user.username} disabled />
                                        </div>

                                        <div className="mb-2">
                                            <label className="form-label fw-bold">Password</label>
                                            <div className="input-group">
                                                <input type={showPasswords[user._id] ? "text" : "password"} className="form-control" value={user.password} disabled />
                                                <button className="btn btn-outline-secondary" onClick={() => setShowPasswords(prev => ({ ...prev, [user._id]: !prev[user._id] }))}>
                                                    <i className={`fa-solid ${showPasswords[user._id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Role</label>
                                            <input type="text" className="form-control" value={user.role} disabled />
                                        </div>

                                        <div className="d-flex gap-2">
                                            <button className="btn btn-warning" onClick={() => {
                                                setEditingUserId(user._id);
                                                setEditData({
                                                    username: user.username,
                                                    password: user.password,
                                                    role: user.role
                                                });
                                            }}>
                                                <i className="fa-solid fa-pen-to-square me-1"></i>Edit
                                            </button>

                                            <button className="btn btn-danger" onClick={() => handleDeleteUser(user._id)} disabled={deletingUserId === user._id}>
                                                {deletingUserId === user._id ? (
                                                    <><span className="spinner-border spinner-border-sm me-2" />Deleting...</>
                                                ) : (
                                                    <><i className="fa-solid fa-trash me-1"></i>Delete</>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}