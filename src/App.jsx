import { useState } from 'react';
import IdentificationForm from './IdentificationForm';
import './App.css';

const VALID_CREDENTIALS = {
  username: 'identificationcollab',
  password: 'rhconnecteoidentif'
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('identificationAuth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogout = () => {
    window.localStorage.removeItem('identificationAuth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleLogin = (event) => {
    event.preventDefault();

    if (username.trim() === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      window.localStorage.setItem('identificationAuth', 'true');
      setIsAuthenticated(true);
      setError('');
      return;
    }

    setError('Identifiants incorrects. Veuillez réessayer.');
  };

  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>Connexion</h1>

          <div className="login-field">
            <label htmlFor="username">Nom d’utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Votre nom d'utilisateur..."
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe..."
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button">Se connecter</button>
        </form>
      </div>
    );
  }

  return <IdentificationForm onLogout={handleLogout} />;
}

export default App;
