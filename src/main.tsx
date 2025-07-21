
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('DjannyTok app starting...');
console.log('Current location:', window.location.href);

createRoot(document.getElementById("root")!).render(<App />);
