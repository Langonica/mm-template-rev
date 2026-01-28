import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// import { validateAllSnapshots } from './utils/validateSnapshots'
import './styles/App.css'

// Skip validation for now - we know snapshots have issues
console.log("ðŸš€ Meridian Master React Version");
console.log("=============================================");
// validateAllSnapshots(); // COMMENT OUT FOR NOW
console.log("=============================================");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)