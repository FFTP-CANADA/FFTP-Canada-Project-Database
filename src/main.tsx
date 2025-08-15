import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("MAIN.TSX IS EXECUTING");
createRoot(document.getElementById("root")!).render(<App />);
