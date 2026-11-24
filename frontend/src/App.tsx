import { useEffect, useState } from "react";
import { Login } from "./pages/login";
import { Home } from "./pages/home";
import {
  atualizarMeuPerfil,
  buscarMeuPerfil,
  fazerCadastro,
  fazerLogin,
  limparSessao,
  obterUsuarioSalvo,
  temSessao,
  type UsuarioSessao,
} from "./services/api";

export function App() {
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(() => obterUsuarioSalvo());

  async function handleAutenticado(perfilInicial: UsuarioSessao) {
    setUsuario(perfilInicial);
    try {
      setUsuario(await buscarMeuPerfil());
    } catch {
      // O login já trouxe o perfil; mantém esse retorno enquanto o /me é corrigido/verificado.
    }
  }

  useEffect(() => {
    if (!temSessao()) return;

    let ativo = true;
    buscarMeuPerfil()
      .then((perfil) => {
        if (ativo) setUsuario(perfil);
      })
      .catch((error: unknown) => {
        // Mantém o perfil recebido no login visível enquanto o backend retorna erro.
        console.error("Não foi possível atualizar o perfil da sessão:", error);
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (!usuario) {
    return (
      <Login
        aoEntrar={async (email, senha) => {
          await handleAutenticado(await fazerLogin(email, senha));
        }}
        aoCadastrar={async (nome, email, senha) => {
          await handleAutenticado(await fazerCadastro(nome, email, senha));
        }}
      />
    );
  }

  return (
    <Home
      usuario={usuario}
      aoAtualizarPerfil={async (nome) => {
        setUsuario(await atualizarMeuPerfil(nome));
      }}
      aoSair={() => {
        limparSessao();
        setUsuario(null);
      }}
    />
  );
}

export default App;
