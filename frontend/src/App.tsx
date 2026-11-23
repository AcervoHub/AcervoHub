import { useState } from 'react';
import { Login, type RespostaAutenticacao } from './pages/login';
import { Home, type RotaMenu, type UsuarioPerfil } from './pages/home';
import { Search } from './pages/search';
import { Dashboard } from './pages/dashboard';
import { Usuario } from './pages/usuario';

export type TelaAtiva = 'login' | RotaMenu;

export function App() {
  const [telaAtual, setTelaAtual] = useState<TelaAtiva>('login');
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);

  function handleNavegar(rota: RotaMenu) {
    setTelaAtual(rota);
  }

  function handleEntrar(dados?: RespostaAutenticacao) {
    if (dados?.usuario) {
      const nome = dados.usuario.nome?.trim() || 'Usuário';
      const arrobaGerado =
        dados.usuario.arroba?.trim() ||
        `@${nome.toLowerCase().replace(/\s+/g, '')}`;

      setUsuario({
        id: dados.usuario.id,
        nome,
        arroba: arrobaGerado,
        fotoUrl: dados.usuario.fotoUrl ?? null,
      });
    }
    setTelaAtual('home');
  }

  function handleSair() {
    setUsuario(null);
    setTelaAtual('login');
  }

  if (telaAtual === 'login') {
    return <Login aoEntrar={handleEntrar} />;
  }

  if (telaAtual === 'search') {
    return (
      <Search
        usuario={usuario}
        aoNavegar={handleNavegar}
        aoSair={handleSair}
      />
    );
  }

  if (telaAtual === 'dashboard') {
    return (
      <Dashboard
        usuario={usuario}
        aoNavegar={handleNavegar}
        aoSair={handleSair}
      />
    );
  }

  if (telaAtual === 'perfil') {
    return (
      <Usuario
        usuario={usuario}
        aoNavegar={handleNavegar}
        aoSair={handleSair}
        aoSalvarPerfil={(dadosAtualizados) => {
          setUsuario((anterior) => ({
            ...anterior,
            nome: dadosAtualizados.nome,
            arroba: dadosAtualizados.arroba,
          }));
        }}
      />
    );
  }

  return (
    <Home
      usuario={usuario}
      aoNavegar={handleNavegar}
      aoSair={handleSair}
    />
  );
}

export default App;