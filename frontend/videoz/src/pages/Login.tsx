import { useState } from "react";
import { login } from "../services/authService";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom"; 
import "./Auth.css"; // Import the CSS

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user, token } = await login(email, password);
      setAuth(user, token);
      navigate("/feed"); 
    } catch (err: any) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">VideoZ</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-button" type="submit">Log in</button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? 
          <Link to="/register" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
}