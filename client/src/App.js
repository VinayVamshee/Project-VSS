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
import InputField from './Components/InputField';
import LoginHistory from './Components/LoginHistory';
import UserInformation from './Components/UserInformation';

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

          <Route path="/new-case" element={<NewCase />} />
          <Route path='/inProgress' element={<InProgress />} />
          <Route path='/closedCases' element={<ClosedCases />} />
          <Route path="/settings" element={<Settings />}>
            <Route path="input-fields" element={<InputField />} />
            <Route path="login-history" element={<LoginHistory />} />
             <Route path="users-information" element={<UserInformation />} />
          </Route>


        </Routes>
      </div>
    </Router>
  );
}

export default App;
