import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function LoginHistory() {

    const [history, setHistory] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        axios.get('https://vss-server.vercel.app/admin/login-history')
            .then(res => {
                setHistory(res.data);
                setFiltered(res.data);
            })
            .catch(err => console.error('Failed to fetch login history', err));
    }, []);

    useEffect(() => {
        let data = [...history];

        // Filter by name
        if (search.trim()) {
            data = data.filter(log =>
                log.username.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filter by date
        if (dateFrom) {
            const from = new Date(dateFrom);
            data = data.filter(log => new Date(log.loginTime) >= from);
        }

        if (dateTo) {
            const to = new Date(dateTo);
            data = data.filter(log => new Date(log.loginTime) <= to);
        }

        // Sort
        data.sort((a, b) => {
            const dateA = new Date(a.loginTime);
            const dateB = new Date(b.loginTime);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFiltered(data);
    }, [search, sortOrder, dateFrom, dateTo, history]);

    return (
        <div className="p-5" style={{height:'93vh', overflow:'scroll'}}>

            {/* Filters */}
            <div className="row g-2 mb-3 align-items-end">
                <div className="col-md-4">
                    <label className="form-label mb-1 fw-semibold">Search by Name</label>
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-search" /></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter username"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-3">
                    <label className="form-label mb-1 fw-semibold">From</label>
                    <input type="datetime-local" className="form-control" value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="col-md-3">
                    <label className="form-label mb-1 fw-semibold">To</label>
                    <input type="datetime-local" className="form-control" value={dateTo}
                        onChange={e => setDateTo(e.target.value)} />
                </div>
                <div className="col-md-2">
                    <label className="form-label mb-1 fw-semibold">Sort</label>
                    <select className="form-select" value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}>
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-responsive rounded border">
                <table className="table table-striped table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>User Type</th>
                            <th>Username</th>
                            <th>Login Time</th>
                            <th>IP Address</th>
                            <th>User Agent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map((log, i) => (
                            <tr key={i}>
                                <td>{log.userType}</td>
                                <td>{log.username}</td>
                                <td>{new Date(log.loginTime).toLocaleString()}</td>
                                <td>{log.ipAddress}</td>
                                <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>{log.userAgent}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center text-muted py-3">No records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
