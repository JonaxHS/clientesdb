import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import LoginForm from './LoginForm';
import SettingsPanel from './SettingsPanel';

function getExpectedToken(): string {
    const pass = process.env.ADMIN_PASSWORD || 'Admin1234';
    return createHash('sha256').update(pass + '-clientesdb-2024').digest('hex');
}

export default function ConfiguracionPage() {
    const cookieStore = cookies();
    const session = cookieStore.get('admin_session')?.value;
    const isAuth = session === getExpectedToken();

    return (
        <main className="container">
            <header className="header">
                <div className="header-logo">⚙️</div>
                <h1>Configuración</h1>
                <p>Administración del servidor y SSL</p>
            </header>
            {isAuth ? <SettingsPanel /> : <LoginForm />}
        </main>
    );
}
