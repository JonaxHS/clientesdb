import ClientForm from '@/components/ClientForm';
import ClientList from '@/components/ClientList';

async function getClients() {
  try {
    const res = await fetch('http://web:3000/api/clients', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const clients = await getClients();

  return (
    <main className="container">
      <header className="header">
        <div className="header-logo">🔐</div>
        <h1>ClientesDB</h1>
        <p>Gestión de Credenciales y Domótica</p>
      </header>

      <div className="dashboard-grid">
        <section className="form-section card">
          <h2>➕ Nuevo Cliente</h2>
          <ClientForm />
        </section>

        <section className="list-section card">
          <h2>👥 Clientes <span className="count-badge">{clients.length}</span></h2>
          <ClientList clients={clients} />
        </section>
      </div>
    </main>
  );
}
