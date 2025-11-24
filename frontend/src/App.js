import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/editor/:projectId" 
            element={isAuthenticated ? <EditorPage /> : <Navigate to="/login" />} 
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
