import React, { useEffect, useState } from "react";

export default function Employees({ api }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    position: "",
    hire_date: "",
    department: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [deps, emps] = await Promise.all([
        api.get("/api/departments/"),
        api.get("/api/employees/"),
      ]);
      setDepartments(deps.data);
      setEmployees(emps.data);
    } catch (e) {
      setError("Impossible de charger les données. Le backend tourne bien ?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        department: form.department ? Number(form.department) : null,
      };
      await api.post("/api/employees/", payload);
      setForm({ first_name: "", last_name: "", email: "", position: "", hire_date: "", department: "" });
      await load();
    } catch (e) {
      setError("Erreur lors de l'ajout. Vérifie les champs (email unique, date, etc.).");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section>
        <h2>Employés</h2>
        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Poste</th>
                <th>Date d'embauche</th>
                <th>Département</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.first_name} {e.last_name}</td>
                  <td>{e.email}</td>
                  <td>{e.position}</td>
                  <td>{e.hire_date}</td>
                  <td>{e.department_detail?.name || "-"}</td>
                </tr>
              ))}
              {employees.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center" }}>Aucun employé</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h3>Ajouter un employé</h3>
        <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              Prénom
              <input value={form.first_name} onChange={(ev) => update("first_name", ev.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
            <label>
              Nom
              <input value={form.last_name} onChange={(ev) => update("last_name", ev.target.value)} style={{ width: "100%", padding: 8 }} />
            </label>
          </div>
          <label>
            Email
            <input value={form.email} onChange={(ev) => update("email", ev.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>
          <label>
            Poste
            <input value={form.position} onChange={(ev) => update("position", ev.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>
          <label>
            Date d'embauche
            <input type="date" value={form.hire_date} onChange={(ev) => update("hire_date", ev.target.value)} style={{ width: "100%", padding: 8 }} />
          </label>
          <label>
            Département
            <select value={form.department} onChange={(ev) => update("department", ev.target.value)} style={{ width: "100%", padding: 8 }}>
              <option value="">-- Aucun --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>

          <button type="submit" style={{ padding: "10px 12px", cursor: "pointer" }}>Ajouter</button>
        </form>

        <p style={{ opacity: 0.8, marginTop: 10 }}>
          Astuce: commence par créer quelques départements dans l’admin Django ou via l’API <code>/api/departments/</code>.
        </p>
      </section>
    </div>
  );
}
