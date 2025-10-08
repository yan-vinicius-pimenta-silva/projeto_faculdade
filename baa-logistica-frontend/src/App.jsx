import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AlterarSenha from './pages/AlterarSenha';
import Dashboard from './pages/Dashboard';
import Motoristas from './pages/Motoristas';
import Veiculos from './pages/Veiculos';
import Clientes from './pages/Clientes';
import Cargas from './pages/Cargas';
import Viagens from './pages/Viagens';
import './App.css';

// Layout com Navbar (para páginas protegidas)
const PrivateLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="app-content">
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota pública - Login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Dashboard />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/motoristas"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Motoristas />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/veiculos"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Veiculos />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/clientes"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Clientes />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/cargas"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Cargas />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/viagens"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <Viagens />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/alterar-senha"
            element={
              <PrivateRoute>
                <PrivateLayout>
                  <AlterarSenha />
                </PrivateLayout>
              </PrivateRoute>
            }
          />

          {/* Redirecionar qualquer rota não encontrada */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;