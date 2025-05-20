import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'white';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className='Navigation'>
      <Link className={`btn ${isActive('/')}`} to='/'>
        <i className="fa-solid fa-house fa-lg me-1"></i> Home
      </Link>
      <Link className={`btn ${isActive('/new-case')}`} to='/new-case'>
        <i className="fa-solid fa-square-plus fa-lg me-2"></i>Register Case
      </Link>
      <Link className={`btn ${isActive('/inProgress')}`} to='/inProgress'>
        <i className="fa-solid fa-circle-dot fa-lg me-1" style={{ color: '#ffc800' }}></i>In Progress
      </Link>
      <Link className={`btn ${isActive('/closedCases')}`} to='/closedCases'>
        <i className="fa-solid fa-circle-dot fa-lg me-1" style={{ color: 'red' }}></i>Closed Cases
      </Link>
       <Link className={`btn ${isActive('/Settings')}`} to='/Settings'>
        <i className="fa-solid fa-gear fa-lg me-1"></i> Settings
      </Link>
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
      </select>
    </div>
  );
}
