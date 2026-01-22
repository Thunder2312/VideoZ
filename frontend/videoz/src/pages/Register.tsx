import { useState } from "react";
import { register } from "../services/authService";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css"; 
export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user, token } = await register(username, email, password);
      setAuth(user, token);
      navigate("/feed"); 
    } catch (err: any) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">VideoZ</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            className="auth-input"
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          <input 
            className="auth-input"
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            className="auth-input"
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button className="auth-button" type="submit">Sign up</button>
        </form>

        <div className="auth-footer">
          Have an account? 
          <Link to="/" className="auth-link">Log in</Link>
        </div>
      </div>
    </div>
  );
}