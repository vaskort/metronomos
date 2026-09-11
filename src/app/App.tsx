import './App.css';
import Metronome from './components/Metronome';
import Footer from './components/Footer/Footer';

export default function App() {
  return (
    <main className="app-shell">
      <h1 className="visually-hidden">Metronomos — Online Metronome</h1>
      <div className="app-panel">
        <Metronome />
        <Footer />
      </div>
    </main>
  );
}
