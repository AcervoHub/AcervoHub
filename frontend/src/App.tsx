import { useState } from 'react';
import { Login, type RespostaAutenticacao } from './pages/login';
import { Home, type RotaMenu, type UsuarioPerfil } from './pages/home';
import { Search } from './pages/search';
import { Dashboard } from './pages/dashboard';
import { Usuario } from './pages/usuario';
import {
  atualizarLivro,
  buscarLivros,
  buscarMinhaEstante,
  encerrarSessaoApi,
  fazerCadastro,
  fazerLogin,
} from './services/api';

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
    encerrarSessaoApi();
    setUsuario(null);
    setTelaAtual('login');
  }

  if (telaAtual === 'login') {
    return (
      <Login
        aoEntrar={handleEntrar}
        aoEnviarLogin={async ({ email, senha }) => ({
          usuario: await fazerLogin(email, senha),
        })}
        aoEnviarCadastro={async ({ nome, email, senha }) => ({
          usuario: await fazerCadastro(nome, email, senha),
        })}
      />
    );
  }

  if (telaAtual === 'search') {
    return (
      <Search
        usuario={usuario}
        aoNavegar={handleNavegar}
        aoSair={handleSair}
        aoBuscarLivros={async (termo) => {
          const [catalogo, estante] = await Promise.all([
            buscarLivros(termo),
            buscarMinhaEstante(),
          ]);
          const pessoais = new Map(
            estante.results.map((livro) => [livro.book.googleBooksId, livro]),
          );

          return catalogo.results.map((livro) => {
            const pessoal = pessoais.get(livro.googleBooksId);
            return {
              id: livro.googleBooksId,
              categoria: livro.categories[0] ?? 'Sem categoria',
              titulo: livro.title,
              autor: livro.authors.join(', ') || 'Autor desconhecido',
              nota: pessoal?.rating ?? null,
              capaUrl: livro.coverUrl,
              salvo: pessoal?.isFavorite ?? false,
              jaLi: Boolean(pessoal?.finishedAt),
            };
          });
        }}
        aoAlternarSalvarLivro={async (id, novoValor) => {
          await atualizarLivro(String(id), { isFavorite: novoValor });
        }}
        aoAlternarJaLiLivro={async (id, novoValor) => {
          await atualizarLivro(String(id), {
            finishedAt: novoValor ? new Date().toISOString() : null,
          })
        }}
      />
    );
  }

  if (telaAtual === 'dashboard') {
    return (
      <Dashboard
        usuario={usuario}
        aoNavegar={handleNavegar}
        aoSair={handleSair}
        buscarDadosDashboard={async () => {
          const estante = await buscarMinhaEstante();
          const lidos = estante.results.filter((livro) => Boolean(livro.finishedAt));
          return {
            usuario: usuario ?? undefined,
            resumo: {
              livrosLidos: lidos.length,
              paginasLidas: lidos.reduce(
                (total, livro) => total + (livro.book.pageCount ?? 0),
                0,
              ),
              filaLeitura: estante.total - lidos.length,
            },
          };
        }}
      />
    );
  }

  if (telaAtual === 'perfil') {
    return (
      <Usuario
        usuario={usuario}
        aoNavegar={handleNavegar}
        aoSair={handleSair}
        buscarDadosUsuario={async () => {
          const estante = await buscarMinhaEstante();
          const lidos = estante.results.filter((livro) => Boolean(livro.finishedAt)).length;
          return {
            usuario: usuario ?? undefined,
            resumo: {
              livrosLidos: lidos,
              queroLer: estante.total - lidos,
            },
          };
        }}
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
      buscarDadosHome={async () => {
        const estante = await buscarMinhaEstante();
        const livros = estante.results;
        const lidos = livros.filter((livro) => Boolean(livro.finishedAt));
        const notas = livros
          .map((livro) => livro.rating)
          .filter((nota): nota is number => nota !== null);

        return {
          usuario: usuario ?? undefined,
          resumo: {
            livrosLidos: lidos.length,
            queroLer: estante.total - lidos.length,
            mediaNotas: notas.length
              ? notas.reduce((total, nota) => total + nota, 0) / notas.length
              : null,
          },
          estante: livros.map((livro) => ({
            id: livro.id,
            categoria: livro.book.categories[0] ?? 'Sem categoria',
            titulo: livro.book.title,
            autor: livro.book.authors.join(', ') || 'Autor desconhecido',
            capaUrl: livro.book.coverUrl,
            status: livro.finishedAt ? 'lidos' as const : 'queroLer' as const,
          })),
        };
      }}
    />
  );
}

export default App;
