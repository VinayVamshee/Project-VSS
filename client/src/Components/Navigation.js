import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme or default to 'white'
    return localStorage.getItem('theme') || 'white';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className='Navigation'>
      <Link className='btn' to='/new-sheet'>Register New Case</Link>
      <Link className='btn' to='/'>Cases</Link>
      <select value={theme} onChange={(e) => setTheme(e.target.value)} className='btn'>
        <option value="white">☀️ Light</option>
        <option value="black">🌑 Dark</option>
        <option value="red">🩸 Blood</option>
        <option value="blue">🌊 Ocean</option>
        <option value="pink">🌸 Rose Blush</option>
        <option value="yellow">🌞 Sunbeam</option>
      </select>
    </div>
  );
}
