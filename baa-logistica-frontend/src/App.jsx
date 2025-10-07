// ============================================
// src/App.jsx
// ============================================
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Dashboard from './pages/Dashboard';
import Motoristas from './pages/Motoristas';
import Veiculos from './pages/Veiculos';
import Cargas from './pages/Cargas';
import Viagens from './pages/Viagens';
import Clientes from './pages/Clientes';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/motoristas" element={<Motoristas />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/cargas" element={<Cargas />} />
              <Route path="/viagens" element={<Viagens />} />
              <Route path="/clientes" element={<Clientes />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;