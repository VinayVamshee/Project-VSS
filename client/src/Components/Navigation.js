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

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`Navigation d-flex flex-column ${isCollapsed ? 'collapsed' : ''}`}>

      <button
        className="btn btn-sm "
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
      </button>
      <Link className={`btn ${isActive('/')}`} to='/'>
        <i className="fa-solid fa-house fa-lg "></i>
        {!isCollapsed && 'Home'}
      </Link>

      {(IsUserLoggedIn || IsAdminLoggedIn) && (
        <>
          <Link className={`btn ${isActive('/new-case')}`} to='/new-case'>
            <i className="fa-solid fa-square-plus fa-lg "></i>
            {!isCollapsed && 'Register Case'}
          </Link>
          <Link className={`btn ${isActive('/inProgress')}`} to='/inProgress'>
            <i className="fa-solid fa-circle-dot fa-lg " style={{ color: '#ffc800' }}></i>
            {!isCollapsed && 'In Progress'}
          </Link>
          <Link className={`btn ${isActive('/closedCases')}`} to='/closedCases'>
            <i className="fa-solid fa-circle-dot fa-lg " style={{ color: 'red' }}></i>
            {!isCollapsed && 'Closed Cases'}
          </Link>
        </>
      )}

      {IsAdminLoggedIn && (
        <Link className={`btn ${isActive('/settings')}`} to='/settings'>
          <i className="fa-solid fa-gear fa-lg "></i>
          {!isCollapsed && 'Settings'}
        </Link>
      )}

      {IsUserLoggedIn ? (
        <button className="btn" onClick={() => {
          localStorage.removeItem('userToken');
          setIsUserLoggedIn(false);
          localStorage.removeItem('userRole');
          window.location.reload();
        }}>
          {!isCollapsed && 'User Logout'}
          <i className="fa-solid fa-right-from-bracket fa-lg "></i>
        </button>
      ) : IsAdminLoggedIn ? (
        <button className="btn " onClick={() => {
          localStorage.removeItem('adminToken');
          setIsAdminLoggedIn(false);
          window.location.reload();
        }}>
          <i className="fa-solid fa-right-from-bracket fa-lg "></i>
          {!isCollapsed && 'Admin Logout'}
        </button>
      ) : (
        <button className="btn" onClick={() => setShowChooseLoginModal(true)}>
          <i className="fa-solid fa-user fa-lg "></i>
          {!isCollapsed && 'Login'}
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
      {!isCollapsed && (
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
      )}
    </div>
  );
}
