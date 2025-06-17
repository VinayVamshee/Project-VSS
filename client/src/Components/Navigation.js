import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const [IsUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [IsAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('userToken')) {
      setIsUserLoggedIn(true);
    } else if (localStorage.getItem('adminToken')) {
      setIsAdminLoggedIn(true);
    }
  }, []);



  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'white');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const [userLoginData, setUserLoginData] = useState({ username: '', password: '' });
  const [userRegisterData, setUserRegisterData] = useState({ username: '', password: '', role: '' });

  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
  const [adminRegisterData, setAdminRegisterData] = useState({ username: '', password: '', phoneno: '', fullname: '' });

  const handleUserLogin = async () => {
    try {
      const res = await axios.post('https://vss-server.vercel.app/user/login', userLoginData);
      const { token, role } = res.data;

      if (token && role) {
        localStorage.setItem('userToken', token);
        localStorage.setItem('userRole', role);  // Save role here
        setIsUserLoggedIn(true);
        alert('User login successful');
      }
    } catch (err) {
      alert('Login failed');
    }
  };


  const handleUserRegister = async () => {
    try {
      await axios.post('https://vss-server.vercel.app/user', userRegisterData);
      alert('User registered successfully');
    } catch (err) {
      alert('Registration failed');
    }
  };

  const handleAdminLogin = async () => {
    try {
      const res = await axios.post('https://vss-server.vercel.app/admin/login', adminLoginData);
      const token = res.data.token;
      if (token) {
        localStorage.setItem('adminToken', token);
        setIsAdminLoggedIn(true);
        alert('Admin login successful');
      }
    } catch (err) {
      alert('Admin login failed');
    }
  };

  const handleAdminRegister = async () => {
    try {
      await axios.post('https://vss-server.vercel.app/admin', adminRegisterData);
      alert('Admin registered successfully');
    } catch (err) {
      alert('Admin registration failed');
    }
  };

  const [showChooseLoginModal, setShowChooseLoginModal] = useState(false);

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
    <div className='Navigation'>
      <Link className={`btn ${isActive('/')}`} to='/'> <i className="fa-solid fa-house fa-lg me-1"></i> Home </Link>
      {
        (IsUserLoggedIn || IsAdminLoggedIn) ?
          (
            <>
              <Link className={`btn ${isActive('/new-case')}`} to='/new-case'> <i className="fa-solid fa-square-plus fa-lg me-2"></i>Register Case </Link>
              <Link className={`btn ${isActive('/inProgress')}`} to='/inProgress'> <i className="fa-solid fa-circle-dot fa-lg me-1" style={{ color: '#ffc800' }}></i>In Progress </Link>
              <Link className={`btn ${isActive('/closedCases')}`} to='/closedCases'> <i className="fa-solid fa-circle-dot fa-lg me-1" style={{ color: 'red' }}></i>Closed Cases </Link>
            </>
          )
          :
          null
      }
      {
        IsAdminLoggedIn ?
          <Link className={`btn ${isActive('/Settings')}`} to='/Settings'> <i className="fa-solid fa-gear fa-lg me-1"></i> Settings </Link>
          : null
      }
      {
        IsAdminLoggedIn ?
          <div className="dropdown">
            <button className="btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i className="fa-solid fa-id-card fa-lg me-2"></i>Register
            </button>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#UserRegisterModal">User Register</button></li>
              <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#AdminRegisterModal">Admin Register</button></li>

            </ul>
          </div>
          :
          null
      }
      {
        IsAdminLoggedIn ?
          <button className="btn" data-bs-toggle="modal" data-bs-target="#loginHistoryModal">
            <i class="fa-solid fa-clock-rotate-left fa-lg me-2"></i>View Login History
          </button>
          :
          null
      }
      <div className="modal fade" id="loginHistoryModal" tabIndex="-1" aria-labelledby="loginHistoryModalLabel" aria-hidden="true" data-bs-backdrop="static">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header ">
              <h5 className="modal-title" id="loginHistoryModalLabel">🕒 Login History</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" />
            </div>

            <div className="modal-body">
              {/* All Filters in One Row */}
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

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>

      {IsUserLoggedIn ? (
        <button
          className="btn"
          onClick={() => {
            localStorage.removeItem('userToken');
            setIsUserLoggedIn(false);
            localStorage.removeItem('userRole');
            window.location.reload();
          }}
        >
          User Logout<i className="fa-solid fa-right-from-bracket fa-lg ms-2"></i>
        </button>
      ) : IsAdminLoggedIn ? (
        <button
          className="btn me-2"
          onClick={() => {
            localStorage.removeItem('adminToken');
            setIsAdminLoggedIn(false);
            window.location.reload();
          }}
        >
          Admin Logout<i className="fa-solid fa-right-from-bracket fa-lg ms-2"></i>
        </button>
      ) : (
        <button
          className="btn"
          onClick={() => setShowChooseLoginModal(true)}
        >
          <i className="fa-solid fa-user fa-lg me-2"></i>Login
        </button>
      )}

      {showChooseLoginModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">Select Login Type</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChooseLoginModal(false)}
                ></button>
              </div>
              <div className="modal-body d-flex justify-content-around">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowChooseLoginModal(false);
                    // Open UserLoginModal manually
                    const userModal = new window.bootstrap.Modal(document.getElementById('UserLoginModal'));
                    userModal.show();
                  }}
                >
                  User Login
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setShowChooseLoginModal(false);
                    const adminModal = new window.bootstrap.Modal(document.getElementById('AdminLoginModal'));
                    adminModal.show();
                  }}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="modal fade" id="UserLoginModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop='false'>
        <div className="modal-dialog">
          <div className="modal-content p-3">
            <div className="modal-header">
              <h5 className="modal-title">User Login</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <input className="form-control mb-2" placeholder="Username" onChange={e => setUserLoginData({ ...userLoginData, username: e.target.value })} />
              <input className="form-control mb-2" type="password" placeholder="Password" onChange={e => setUserLoginData({ ...userLoginData, password: e.target.value })} />
              <button className="btn btn-primary" onClick={handleUserLogin}>Login</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="UserRegisterModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop='false'>
        <div className="modal-dialog">
          <div className="modal-content p-3">
            <div className="modal-header">
              <h5 className="modal-title">User Registration</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <input className="form-control mb-2" placeholder="Username" onChange={e => setUserRegisterData({ ...userRegisterData, username: e.target.value })} />
              <input className="form-control mb-2" type="password" placeholder="Password" onChange={e => setUserRegisterData({ ...userRegisterData, password: e.target.value })} />
              <select
                className="form-select mb-2"
                onChange={e => setUserRegisterData({ ...userRegisterData, role: e.target.value })}
              >
                <option value="">Select Role</option>
                <option value="Preventive Check Decoy Check Complaint">Preventive Check | Decoy Check | Complaint</option>
                <option value="DAR Action">DAR Action</option>
              </select>

              <button className="btn btn-success" onClick={handleUserRegister}>Register</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="AdminLoginModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop='false'>
        <div className="modal-dialog">
          <div className="modal-content p-3">
            <div className="modal-header">
              <h5 className="modal-title">Admin Login</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <input className="form-control mb-2" placeholder="Username" onChange={e => setAdminLoginData({ ...adminLoginData, username: e.target.value })} />
              <input className="form-control mb-2" type="password" placeholder="Password" onChange={e => setAdminLoginData({ ...adminLoginData, password: e.target.value })} />
              <button className="btn btn-warning" onClick={handleAdminLogin}>Login</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="AdminRegisterModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop='false'>
        <div className="modal-dialog">
          <div className="modal-content p-3">
            <div className="modal-header">
              <h5 className="modal-title">Admin Registration</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <input className="form-control mb-2" placeholder="Username" onChange={e => setAdminRegisterData({ ...adminRegisterData, username: e.target.value })} />
              <input className="form-control mb-2" type="password" placeholder="Password" onChange={e => setAdminRegisterData({ ...adminRegisterData, password: e.target.value })} />
              <input className="form-control mb-2" placeholder="Phone No" onChange={e => setAdminRegisterData({ ...adminRegisterData, phoneno: e.target.value })} />
              <input className="form-control mb-2" placeholder="Full Name" onChange={e => setAdminRegisterData({ ...adminRegisterData, fullname: e.target.value })} />
              <button className="btn btn-dark" onClick={handleAdminRegister}>Register</button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <select value={theme} onChange={(e) => setTheme(e.target.value)} className='btn'>
        <option value="white">☀️ Light</option>
        <option value="black">🌑 Dark</option>
        <option value="red">🩸 Blood</option>
        <option value="blue">🌊 Ocean</option>
        <option value="pink">🌸 Rose Blush</option>
        <option value="yellow">🌞 Sunbeam</option>
        <option value="brown">🍂 Earthy</option>
        <option value="green">🌿 Forest</option>
        <option value="purple">💜 Lavender</option>
        <option value="orange">🍊 Sunset</option>
        <option value="grey">🌫️ Fog</option>
        <option value="aqua">🐬 Aqua Breeze</option>
        <option value="cool-silver">🧊 Cool Silver</option>
        <option value="mint">🍀 Mint</option>

        {/* Earth Themes */}
        <option value="earth-tones">🌰 Earth Tones</option>
        <option value="mountain-stone">🪨 Mountain Stone</option>
        <option value="sand-dune">🏜️ Sand Dune</option>
        <option value="forest-floor">🍃 Forest Floor</option>
        <option value="forest">🌲 Deep Forest</option>

        {/* Space / Galaxy Themes */}
        <option value="indigo-night">🫐 Indigo Night</option>
        <option value="galaxy">🌌 Galaxy</option>
        <option value="nebula-dream">💫 Nebula Dream</option>
        <option value="cosmic-horizon">🌠 Cosmic Horizon</option>
        <option value="stellar-sunset">🌇 Stellar Sunset</option>
        <option value="aurora-borealis">🌈 Aurora Borealis</option>
        <option value="supernova">💥 Supernova Burst</option>
        <option value="cosmic-neon">🌌 Cosmic Neon</option>
        <option value="stellar-candy">🍬 Stellar Candy</option>

      </select>

    </div>
  );
}
