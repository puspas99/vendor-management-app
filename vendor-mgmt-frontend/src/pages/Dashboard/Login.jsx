import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import styles from "./Dashboard.module.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError(""); // Clear error when user types
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(form.username, form.password);
      
      if (response.success && response.data) {
        // Handle both snake_case (from backend) and camelCase
        const accessToken = response.data.access_token || response.data.accessToken;
        const refreshToken = response.data.refresh_token || response.data.refreshToken;
        const username = response.data.username || form.username;
        const email = response.data.email || '';
        const role = response.data.role || 'USER';
        
        if (!accessToken) {
          console.error("No access token in response:", response);
          setError("Login failed: No access token received");
          setLoading(false);
          return;
        }
        
        // Store refresh token separately
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        // Set authentication with access token and user info
        login(accessToken, {
          username,
          email,
          role,
          name: username // Using username as display name
        });
        
        console.log("Login successful, token stored. Navigating to home...");
        
        // Navigate immediately - ProtectedRoute will check localStorage
        navigate("/", { replace: true });
      } else {
        console.error("Login failed:", response);
        setError(response.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        "Invalid credentials. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Procurement Team Login</h2>
      <form className={styles.vendorForm} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Username</label>
            <input 
              className={styles.formInput} 
              name="username" 
              type="text" 
              value={form.username} 
              onChange={handleChange} 
              disabled={loading}
              required 
            />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formCol}>
            <label className={styles.formLabel}>Password</label>
            <input 
              className={styles.formInput} 
              name="password" 
              type="password" 
              value={form.password} 
              onChange={handleChange} 
              disabled={loading}
              required 
            />
          </div>
        </div>
        <button 
          className={styles.formBtn} 
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <div style={{ color: "#e53e3e", marginTop: 12 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 18, textAlign: "center" }}>
        <span>Don't have an account? </span>
        <a href="/signup" style={{ color: "#3182ce", textDecoration: "underline", cursor: "pointer" }}>Sign Up</a>
      </div>
    </div>
  );
}
