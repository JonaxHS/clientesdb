import ClientForm from '@/components/ClientForm';
import ClientList from '@/components/ClientList';

export default function Home() {
  return (
    <main className="container">
      <header className="header">
        <div className="header-logo">🔐</div>
        <h1>ClientesDB</h1>
        <p>Gestión de Credenciales y Domótica</p>
        <a href="/configuracion" className="settings-link">⚙️ Configuración</a>
      </header>

      <div className="dashboard-grid">
        <section className="form-section card">
          <h2>➕ Nuevo Cliente</h2>
          <ClientForm />
        </section>

        <section className="list-section card">
          <h2>👥 Clientes</h2>
          <ClientList />
        </section>
      </div>
    </main>
  );
}
