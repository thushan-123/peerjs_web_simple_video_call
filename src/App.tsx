import React from 'react';
import logo from './logo.svg';
import './App.css';
import Conference from "./pages/Conference"
import PeerConnection from './pages/PeerConnection';
import {BrowserRouter, Route, Routes} from "react-router-dom"

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/:user_name' element={<PeerConnection />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
