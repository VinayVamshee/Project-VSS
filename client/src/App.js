import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AddNewSheet from './Components/AddNewSheet';
import Home from './Components/Home';
import Navigation from './Components/Navigation';
import './Components/style.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new-sheet" element={<AddNewSheet />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
