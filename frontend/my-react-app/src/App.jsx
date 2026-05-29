
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import WebCrawler from './pages/WebCrawler/WebCrawler.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/web-crawler" element={<WebCrawler />} />
      </Routes>
    </Router>
  );
}

export default App;
