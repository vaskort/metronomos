import { createRoot } from 'react-dom/client';
import App from './App';
import { initAnalytics } from './analytics';

initAnalytics();

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);
