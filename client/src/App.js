import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './Components/Navigation';
import './Components/style.css';
import InProgress from './Components/InProgess';
import ClosedCases from './Components/ClosedCases';
import Home from './Components/Home';
import Settings from './Components/Settings';
import NewCase from './Components/NewCase';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path='/' exact element={<Home />} />
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
