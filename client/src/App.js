import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AddNewSheet from './Components/AddNewSheet';
// import Home from './Components/Home';
import Navigation from './Components/Navigation';
import './Components/style.css';
import InProgress from './Components/InProgess';
import ClosedCases from './Components/ClosedCases';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/new-sheet" element={<AddNewSheet />} />
          <Route path='/inProgress' element={<InProgress />} />
          <Route path='/closedCases' element={<ClosedCases />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
