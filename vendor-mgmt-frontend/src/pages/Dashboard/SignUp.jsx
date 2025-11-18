import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import styles from "./Dashboard.module.css";

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginLink, setShowLoginLink] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authService.register(
        form.username,
        form.email,
        form.password,
        form.fullName
      );

      if (response.success) {
        setShowLoginLink(true);
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || 
        "Registration failed. Username or email may already exist."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Procurement Team Sign Up</h2>
      {!showLoginLink ? (
        <form className={styles.vendorForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.formCol}>
              <label className={styles.formLabel}>Full Name</label>
              <input 
                className={styles.formInput} 
                name="fullName" 
                type="text" 
                value={form.fullName} 
                onChange={handleChange} 
                disabled={loading}
                required 
              />
            </div>
          </div>
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
              <label className={styles.formLabel}>Email</label>
              <input 
                className={styles.formInput} 
                name="email" 
                type="email" 
                value={form.email} 
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
            {loading ? "Signing up..." : "Sign Up"}
          </button>
          {error && <div style={{ color: "#e53e3e", marginTop: 12 }}>{error}</div>}
        </form>
      ) : (
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <h3 style={{ color: '#3182ce', marginBottom: 18 }}>Sign up successful!</h3>
          <a href="/login" style={{ color: "#3182ce", textDecoration: "underline", cursor: "pointer", fontSize: '1.1rem' }}>Click here to log in</a>
        </div>
      )}
    </div>
  );
}
