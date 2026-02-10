import React, { useState } from "react";

export default function Login({ api, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/token/", { username, password });
      onLogin(res.data);
    } catch (err) {
      setError("Login échoué. Vérifie username/mot de passe.");
    }
  };

  return (
    <div>
      <h2>Connexion</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </label>
        <button type="submit" style={{ padding: "10px 12px", cursor: "pointer" }}>Se connecter</button>
        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
      </form>
      <p style={{ opacity: 0.8 }}>
        Utilise un compte créé via <code>python manage.py createsuperuser</code>.
      </p>
    </div>
  );
}
