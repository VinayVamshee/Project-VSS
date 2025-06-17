import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function Settings() {

    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');

        if (!adminToken) {
            navigate('/');
        } else {
            setIsAdminLoggedIn(true);
        }
    }, [navigate]);

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    if (!isAdminLoggedIn) return null;
    return (
        <div className='Settings'>
            <div className={`Admin-Options ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
                <button
                    className="btn toggle-btn"
                    onClick={() => setIsSidebarExpanded(prev => !prev)}
                >
                    <i className={`fa-solid ${isSidebarExpanded ? 'fa-angles-left' : 'fa-angles-right'}`}></i>
                </button>

                <Link to="users-information" className="btn w-100">
                    <i className="fa-solid fa-head-side-virus fa-lg me-2"></i>
                    {isSidebarExpanded && "User Information"}
                </Link>

                <Link to="login-history" className="btn w-100">
                    <i className="fa-solid fa-clock-rotate-left fa-lg me-2"></i>
                    {isSidebarExpanded && "Login History"}
                </Link>

                <Link to="input-fields" className="btn w-100 ">
                    <i className="fa-brands fa-wpforms fa-lg me-2"></i>
                    {isSidebarExpanded && "Input Fields"}
                </Link>
            </div>

            <div className='render-component'>

                <Outlet />
            </div>

        </div>

    )
}
