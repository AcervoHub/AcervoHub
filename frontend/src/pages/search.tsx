import { useState, type ComponentProps } from 'react';
import {
  House,
  Search as SearchIcon,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  ChevronRight,
  Compass,
  Star,
  Bookmark,
  Check,
} from 'lucide-react';
import '../styles/search.css';
import { useNavigate } from 'react-router-dom';

export interface UsuarioPerfil {
  id?: number | string;
  nome: string;
  arroba: string;
  fotoUrl?: string | null;
}

export interface LivroPesquisa {
  id: number | string;
  categoria: string;
  titulo: string;
  autor: string;
  nota?: number | string | null;
  capaUrl?: string | null;
  salvo?: boolean;
  jaLi?: boolean;
}

export interface SearchProps {
  usuario?: UsuarioPerfil | null;
  aoSair?: () => void;
  aoNavegar?: (tela: 'home' | 'search' | 'dashboard' | 'perfil') => void;
  aoBuscarLivros?: (termo: string) => Promise<LivroPesquisa[]> | LivroPesquisa[];
  aoAlternarSalvarLivro?: (id: number | string, novoValor: boolean) => Promise<void> | void;
  aoAlternarJaLiLivro?: (id: number | string, novoValor: boolean) => Promise<void> | void;
}

type SubmitFormulario = NonNullable<ComponentProps<'form'>['onSubmit']>;

function pegarIniciais(nome?: string) {
  if (!nome || !nome.trim()) return 'AC';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function formatarNota(nota: number | string | null | undefined) {
  if (nota === null || nota === undefined || nota === '') return '0,0';
  const numero = typeof nota === 'number' ? nota : Number(String(nota).replace(',', '.'));
  if (Number.isNaN(numero)) return String(nota);
  return numero.toFixed(1).replace('.', ',');
}

export function Search({
  usuario = null,
  aoSair,
  aoNavegar,
  aoBuscarLivros,
  aoAlternarSalvarLivro,
  aoAlternarJaLiLivro,
}: SearchProps) {
  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<LivroPesquisa[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomeExibicao = usuario?.nome?.trim() ? usuario.nome : 'Usuário';
  const arrobaExibicao = usuario?.arroba?.trim() ? usuario.arroba : '@leitor';

  const handleSubmit: SubmitFormulario = async (event) => {
    event.preventDefault();
    setErro(null);

    const termoLimpo = termoBusca.trim();
    if (!termoLimpo) {
      setResultados([]);
      setBuscou(false);
      return;
    }

    setBuscando(true);
    setBuscou(true);

    try {
      const livros = aoBuscarLivros ? await aoBuscarLivros(termoLimpo) : [];
      setResultados(livros);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível buscar os livros.');
    } finally {
      setBuscando(false);
    }
  };

  async function alternarSalvar(id: number | string) {
    const livroAtual = resultados.find((livro) => livro.id === id);
    if (!livroAtual) return;

    const proximoValor = !livroAtual.salvo;

    setResultados((anterior) =>
      anterior.map((livro) =>
        livro.id === id ? { ...livro, salvo: proximoValor } : livro
      )
    );

    if (aoAlternarSalvarLivro) {
      await aoAlternarSalvarLivro(id, proximoValor);
    }
  }

  async function alternarJaLi(id: number | string) {
    const livroAtual = resultados.find((livro) => livro.id === id);
    if (!livroAtual) return;

    const proximoValor = !livroAtual.jaLi;

    setResultados((anterior) =>
      anterior.map((livro) =>
        livro.id === id ? { ...livro, jaLi: proximoValor } : livro
      )
    );

    if (aoAlternarJaLiLivro) {
      await aoAlternarJaLiLivro(id, proximoValor);
    }
  }

  return (
    <div id="searchContainer" className="container">
      <div id="menuLateral" className="menu">
        <div id="marcaSidebar" className="iconeTitulo">
          <BookOpen className="iconeBook" />
          <h1 className="titulo">AcervoHub</h1>
        </div>

        <div id="navegacaoPrincipal" className="buttons">
          <button
            id="btnNavInicio"
            type="button"
            className="buttonHome"
            onClick={() => aoNavegar?.('home')}
          >
            <House className="icone" />
            <span className="textButtons">Início</span>
          </button>

          <button
            id="btnNavPesquisar"
            type="button"
            className="buttonSearch"
            onClick={() => aoNavegar?.('search')}
          >
            <SearchIcon className="icone" />
            <span className="textButtons">Pesquisar</span>
          </button>

          <button
            id="btnNavDashboard"
            type="button"
            className="buttonDashboard"
            onClick={() => aoNavegar?.('dashboard')}
          >
            <BarChart3 className="icone" />
            <span className="textButtons">Dashboard</span>
          </button>

          <button
            id="btnNavPerfil"
            type="button"
            className="buttonUser"
            onClick={() => aoNavegar?.('perfil')}
          >
            <User className="icone" />
            <span className="textButtons">Meu perfil</span>
          </button>
        </div>

        <hr className="divisor" />

        <div id="areaPerfilUsuario" className="perfilArea">
          <button
            id="btnCardPerfil"
            type="button"
            className="perfilCard"
            onClick={() => aoNavegar?.('perfil')}
          >
            <div className="avatar">
              {usuario?.fotoUrl ? (
                <img
                  src={usuario.fotoUrl}
                  alt={`Foto de ${nomeExibicao}`}
                  className="avatarImg"
                />
              ) : (
                <span>{pegarIniciais(nomeExibicao)}</span>
              )}
            </div>

            <div className="perfilInfo">
              <span id="perfilUsuarioNome" className="perfilNome">{nomeExibicao}</span>
              <span id="perfilUsuarioArroba" className="perfilHandle">{arrobaExibicao}</span>
            </div>

            <ChevronRight className="perfilSeta" size={18} />
          </button>
        </div>

        <div id="navegacaoSecundaria" className="buttonsSecondary">
          <button
            id="btnSairConta"
            type="button"
            className="buttonExit"
            onClick={aoSair}
          >
            <LogOut className="icone" />
            <span className="textButtons">Sair</span>
          </button>
        </div>
      </div>

      <div id="conteudoPrincipal" className="conteudo">
        <div id="cabecalhoSearch" className="header">
          <p className="subTituloHeader">
            <Compass className="iconeSubtituloHeader" size={14} />
            EXPLORE NOVAS HISTÓRIAS
          </p>
          <h1 id="tituloSearch" className="tituloHeader">O que você procura?</h1>
          <p className="subTituloHeader2">
            Explore o catálogo e descubra novas leituras para a sua estante.
          </p>
        </div>

        <section id="caixaPesquisa" className="caixaPesquisa">
          <form id="formPesquisa" className="formPesquisa" onSubmit={handleSubmit}>
            <SearchIcon className="iconeInputPesquisa" size={18} />

            <input
              id="inputPesquisa"
              type="text"
              className="inputPesquisa"
              placeholder="Título, autor ou ISBN..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              disabled={buscando}
            />

            <button
              id="btnSubmitPesquisa"
              type="submit"
              className="btnPesquisar"
              disabled={buscando}
            >
              {buscando ? 'Pesquisando...' : 'Pesquisar'}
            </button>
          </form>
        </section>

        {erro && (
          <p id="mensagemErroPesquisa" className="mensagemEstadoPesquisa">
            {erro}
          </p>
        )}

        {buscando ? (
          <p id="carregandoPesquisa" className="mensagemEstadoPesquisa">
            Buscando livros no catálogo...
          </p>
        ) : resultados.length > 0 ? (
          <div id="listaResultadosPesquisa" className="gridResultadosPesquisa">
            {resultados.map((livro) => (
              <article
                key={livro.id}
                id={`cardPesquisa-${livro.id}`}
                className="cardLivroPesquisa"
              >
                <div className="capaPesquisa">
                  {livro.capaUrl ? (
                    <img
                      src={livro.capaUrl}
                      alt={livro.titulo}
                      className="capaPesquisaImg"
                    />
                  ) : (
                    <div className="semCapaPesquisa">
                      <span>image</span>
                      <span>not</span>
                      <span>available</span>
                    </div>
                  )}

                  <button
                    id={`btnSalvarPesquisa-${livro.id}`}
                    type="button"
                    className={livro.salvo ? 'btnBookmarkPesquisa ativo' : 'btnBookmarkPesquisa'}
                    onClick={() => alternarSalvar(livro.id)}
                  >
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                </div>

                <div className="infoPesquisa">
                  <span className="categoriaLivro">{livro.categoria}</span>
                  <h2 className="tituloLivroPesquisa">{livro.titulo}</h2>
                  <p className="autorLivro">{livro.autor}</p>

                  <div className="rodapePesquisa">
                    <span className="notaPesquisa">
                      <Star className="iconeEstrelaNota" size={15} fill="currentColor" />
                      {formatarNota(livro.nota)}
                    </span>

                    <button
                      id={`btnJaLiPesquisa-${livro.id}`}
                      type="button"
                      className={livro.jaLi ? 'btnJaLiPesquisa ativo' : 'btnJaLiPesquisa'}
                      onClick={() => alternarJaLi(livro.id)}
                    >
                      <Check size={15} />
                      <span>Já li</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : buscou ? (
          <div id="estadoSemResultados" className="estadoInicialPesquisa">
            <div className="circuloBussola">
              <Compass size={26} />
            </div>
            <h2 className="tituloEstadoPesquisa">Nenhum livro encontrado</h2>
            <p className="descricaoEstadoPesquisa">
              Não encontramos resultados para &ldquo;{termoBusca.trim()}&rdquo;. Tente outro título, autor ou ISBN.
            </p>
          </div>
        ) : (
          <div id="estadoInicialPesquisa" className="estadoInicialPesquisa">
            <div className="circuloBussola">
              <Compass size={26} />
            </div>
            <h2 className="tituloEstadoPesquisa">Seu próximo livro começa aqui</h2>
            <p className="descricaoEstadoPesquisa">
              Pesquise pelo nome de uma obra, autor favorito ou até mesmo pelo ISBN.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}