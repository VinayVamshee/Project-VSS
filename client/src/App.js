import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

import Navigation from './Components/Navigation';
import './Components/style.css';
import InProgress from './Components/InProgess';
import ClosedCases from './Components/ClosedCases';
import Home from './Components/Home';
import Settings from './Components/Settings';
import NewCase from './Components/NewCase';

// ✅ Initialize GA4 with your tracking ID
const TRACKING_ID = 'G-GPZ9QFEGYR'; // Replace with your GA4 ID
ReactGA.initialize(TRACKING_ID);

// ✅ Track page views on route change
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: location.pathname });
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <div className="App">
        <Navigation />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/new-case" element={<NewCase />} />
          <Route path='/inProgress' element={<InProgress />} />
          <Route path='/closedCases' element={<ClosedCases />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
