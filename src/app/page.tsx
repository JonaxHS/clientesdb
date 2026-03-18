import ClientForm from '@/components/ClientForm';

async function getClients() {
  try {
    const res = await fetch('http://localhost:3000/api/clients', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const clients = await getClients();

  return (
    <main className="container">
      <header className="header">
        <h1>Sistema de Clientes</h1>
        <p>Gestión de Credenciales y Domótica</p>
      </header>

      <div className="dashboard-grid">
        <section className="form-section card">
          <h2>Nuevo Cliente</h2>
          <ClientForm />
        </section>

        <section className="list-section card">
          <h2>Clientes ({clients.length})</h2>
          <div className="clients-list">
            {clients.length === 0 ? (
              <p className="empty-state">No hay clientes registrados aún.</p>
            ) : (
              clients.map((client: any) => (
                <div key={client.id} className="client-item">
                  <h3>{client.name}</h3>
                  <div className="client-details">
                    {client.hikvision_user && (
                      <div className="detail-group">
                        <span className="label">Hikvision:</span>
                        <span className="value">{client.hikvision_user} / {client.hikvision_pass}</span>
                      </div>
                    )}
                    {client.google_email && (
                      <div className="detail-group">
                        <span className="label">Google:</span>
                        <span className="value">{client.google_email} / {client.google_pass}</span>
                      </div>
                    )}
                    {client.ewelink_user && (
                      <div className="detail-group">
                        <span className="label">eWeLink:</span>
                        <span className="value">{client.ewelink_user} / {client.ewelink_pass}</span>
                      </div>
                    )}
                    {client.domotics_notes && (
                      <div className="detail-group">
                        <span className="label">Notas Domótica:</span>
                        <span className="value">{client.domotics_notes}</span>
                      </div>
                    )}
                    {(client.latitude && client.longitude) && (
                      <div className="detail-group location">
                        <span className="label">Ubicación:</span>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${client.latitude}&mlon=${client.longitude}#map=18/${client.latitude}/${client.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link button-secondary"
                        >
                          Ver en Mapa 📍
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
