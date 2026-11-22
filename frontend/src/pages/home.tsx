import { useEffect, useState } from 'react';
import {
  House,
  Search,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  ChevronRight,
  BookCheck,
  BookHeart,
  Star,
  Sparkles,
  Bookmark,
  Check,
  Trash2,
} from 'lucide-react';
import '../styles/home.css';
import { useNavigate } from 'react-router-dom';

export interface UsuarioPerfil {
  id?: number | string;
  nome: string;
  arroba: string;
  fotoUrl?: string | null;
}

export interface LivroCuradoria {
  id: number | string;
  categoria: string;
  titulo: string;
  autor: string;
  nota: number | string;
  capaUrl?: string | null;
  salvo: boolean;
  jaLi: boolean;
}

export interface LivroEstante {
  id: number | string;
  categoria: string;
  titulo: string;
  autor: string;
  capaUrl?: string | null;
  status: 'queroLer' | 'lidos';
}

export interface ResumoHome {
  livrosLidos: number;
  queroLer: number;
  mediaNotas: number | null;
}

export interface HomeProps {
  usuario?: UsuarioPerfil | null;
  aoSair?: () => void;
  buscarDadosHome?: () => Promise<{
    usuario?: UsuarioPerfil;
    resumo?: ResumoHome;
    curadoria?: LivroCuradoria[];
    estante?: LivroEstante[];
  }>;
  aoAlternarSalvarCuradoria?: (id: number | string, novoValor: boolean) => Promise<void> | void;
  aoAlternarJaLiCuradoria?: (id: number | string, novoValor: boolean) => Promise<void> | void;
  aoRemoverLivroEstante?: (id: number | string) => Promise<void> | void;
}

function pegarIniciais(nome?: string) {
  if (!nome || !nome.trim()) return 'AC';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function obterPrimeiroNome(nome?: string) {
  if (!nome || !nome.trim()) return 'Leitor';
  return nome.trim().split(/\s+/)[0];
}

function formatarNota(nota: number | string | null | undefined) {
  if (nota === null || nota === undefined || nota === '') return '0,0';
  const numero = typeof nota === 'number' ? nota : Number(String(nota).replace(',', '.'));
  if (Number.isNaN(numero)) return String(nota);
  return numero.toFixed(1).replace('.', ',');
}

export function Home({
  usuario: usuarioInicial = null,
  aoSair,
  buscarDadosHome,
  aoAlternarSalvarCuradoria,
  aoAlternarJaLiCuradoria,
  aoRemoverLivroEstante,
}: HomeProps) {
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(usuarioInicial);
  const [abaEstante, setAbaEstante] = useState<'queroLer' | 'lidos'>('queroLer');
  const [livrosCuradoria, setLivrosCuradoria] = useState<LivroCuradoria[]>([]);
  const [livrosEstante, setLivrosEstante] = useState<LivroEstante[]>([]);
  const [mediaNotasApi, setMediaNotasApi] = useState<number | null>(null);
  const [carregando, setCarregando] = useState<boolean>(Boolean(buscarDadosHome));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setUsuario(usuarioInicial);
  }, [usuarioInicial]);

  useEffect(() => {
    let ativo = true;

    async function carregarHome() {
      if (!buscarDadosHome) {
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);

      try {
        const dados = await buscarDadosHome();
        if (!ativo) return;

        if (dados.usuario) setUsuario(dados.usuario);
        if (dados.curadoria) setLivrosCuradoria(dados.curadoria);
        if (dados.estante) setLivrosEstante(dados.estante);
        if (dados.resumo && typeof dados.resumo.mediaNotas === 'number') {
          setMediaNotasApi(dados.resumo.mediaNotas);
        }
      } catch {
        if (!ativo) return;
        setErro('Não foi possível carregar os dados da sua biblioteca.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarHome();

    return () => {
      ativo = false;
    };
  }, [buscarDadosHome]);

  async function alternarSalvarCuradoria(id: number | string) {
    const livroAtual = livrosCuradoria.find((livro) => livro.id === id);
    if (!livroAtual) return;

    const proximoEstado = !livroAtual.salvo;

    setLivrosCuradoria((anterior) =>
      anterior.map((livro) =>
        livro.id === id ? { ...livro, salvo: proximoEstado } : livro
      )
    );

    if (aoAlternarSalvarCuradoria) {
      await aoAlternarSalvarCuradoria(id, proximoEstado);
    }
  }

  async function alternarJaLiCuradoria(id: number | string) {
    const livroAtual = livrosCuradoria.find((livro) => livro.id === id);
    if (!livroAtual) return;

    const proximoEstado = !livroAtual.jaLi;

    setLivrosCuradoria((anterior) =>
      anterior.map((livro) =>
        livro.id === id ? { ...livro, jaLi: proximoEstado } : livro
      )
    );

    if (aoAlternarJaLiCuradoria) {
      await aoAlternarJaLiCuradoria(id, proximoEstado);
    }
  }

  async function removerLivroEstante(id: number | string) {
    setLivrosEstante((anterior) => anterior.filter((livro) => livro.id !== id));

    if (aoRemoverLivroEstante) {
      await aoRemoverLivroEstante(id);
    }
  }

  const totalQueroLer = livrosEstante.filter((livro) => livro.status === 'queroLer').length;
  const totalLidos = livrosEstante.filter((livro) => livro.status === 'lidos').length;
  const livrosFiltrados = livrosEstante.filter((livro) => livro.status === abaEstante);
  const nomeExibicao = usuario?.nome?.trim() ? usuario.nome : 'Usuário';
  const arrobaExibicao = usuario?.arroba?.trim() ? usuario.arroba : '@leitor';

  return (
    <div id="homeContainer" className="container">
      <div id="menuLateral" className="menu">
        <div id="marcaSidebar" className="iconeTitulo">
          <BookOpen className="iconeBook" />
          <h1 className="titulo">AcervoHub</h1>
        </div>

        <div id="navegacaoPrincipal" className="buttons">
          <button id="btnNavInicio" type="button" className="buttonHome">
            <House className="icone" />
            <span className="textButtons">Início</span>
          </button>

          <button id="btnNavPesquisar" type="button" className="buttonSearch">
            <Search className="icone" />
            <span className="textButtons">Pesquisar</span>
          </button>

          <button id="btnNavDashboard" type="button" className="buttonDashboard">
            <BarChart3 className="icone" />
            <span className="textButtons">Dashboard</span>
          </button>

          <button id="btnNavPerfil" type="button" className="buttonUser">
            <User className="icone" />
            <span className="textButtons">Meu perfil</span>
          </button>
        </div>

        <hr className="divisor" />

        <div id="areaPerfilUsuario" className="perfilArea">
          <button id="btnCardPerfil" type="button" className="perfilCard">
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
        <div id="cabecalhoHome" className="headerDireito">
          <div className="TextHeader">
            <p className="subTituloHeader">SUA BIBLIOTECA PESSOAL</p>
            <h1 id="saudacaoUsuario" className="tituloHeader">
              Olá, {obterPrimeiroNome(usuario?.nome)}.
            </h1>
            <p className="subTituloHeader2">Que história vamos descobrir hoje?</p>
          </div>

          <div className="headerButton">
            <button id="btnEncontrarLivro" type="button" className="buttonSearchHeader">
              <Search className="iconeHeader" />
              <span className="textButtonsHeader">Encontrar um livro</span>
            </button>
          </div>
        </div>

        {erro && (
          <p id="mensagemErroHome" className="subTituloHeader2">
            {erro}
          </p>
        )}

        <div id="resumoLeitura" className="resumoLeitura">
          <div id="cardLivrosLidos" className="livrosLidos">
            <BookCheck className="iconeLido" />

            <div className="conteudoResumo">
              <h1 id="valorLivrosLidos" className="quantidade">
                {carregando ? '-' : totalLidos}
              </h1>
              <p className="textResumo">Livros lidos</p>
            </div>
          </div>

          <div id="cardQueroLer" className="queroLer">
            <BookHeart className="iconeLer" />

            <div className="conteudoResumo">
              <h1 id="valorQueroLer" className="quantidade">
                {carregando ? '-' : totalQueroLer}
              </h1>
              <p className="textResumo">Quero ler</p>
            </div>
          </div>

          <div id="cardMediaAvaliacoes" className="mediaAvaliacoes">
            <Star className="iconeMedia" />

            <div className="conteudoResumo">
              <div className="subtextMedia">
                <h1 id="valorMediaNotas" className="quantidade">
                  {carregando ? '-' : formatarNota(mediaNotasApi)}
                </h1>
                <p className="totalMedia">/5</p>
              </div>
              <p className="textResumo">Média de notas</p>
            </div>
          </div>
        </div>

        <section id="secaoCuradoria" className="secaoCuradoria">
          <div id="cabecalhoCuradoria" className="cabecalhoSecao">
            <div className="tituloSecaoGrupo">
              <p className="subtituloSecao">
                <Sparkles className="iconeSubtituloSecao" size={14} />
                CURADORIA DA SEMANA
              </p>
              <h2 className="tituloSecao">Livros para conhecer</h2>
            </div>

            <button id="btnVerTodosCuradoria" type="button" className="btnVerTodos">
              <span>Ver todos</span>
              <ChevronRight size={16} />
            </button>
          </div>

          <div id="listaCuradoria" className="gridCuradoria">
            {livrosCuradoria.map((livro) => (
              <article
                key={livro.id}
                id={`cardCuradoria-${livro.id}`}
                className="cardLivroCuradoria"
              >
                <div className="capaCuradoria">
                  {livro.capaUrl ? (
                    <img
                      src={livro.capaUrl}
                      alt={livro.titulo}
                      className="capaCuradoriaImg"
                    />
                  ) : (
                    <div className="semCapaCuradoria">
                      <span>image</span>
                      <span>not</span>
                      <span>available</span>
                    </div>
                  )}

                  <button
                    id={`btnSalvarCuradoria-${livro.id}`}
                    type="button"
                    className={livro.salvo ? 'btnBookmarkCuradoria ativo' : 'btnBookmarkCuradoria'}
                    onClick={() => alternarSalvarCuradoria(livro.id)}
                  >
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                </div>

                <div className="infoCuradoria">
                  <span className="categoriaLivro">{livro.categoria}</span>
                  <h3 className="tituloLivroCuradoria">{livro.titulo}</h3>
                  <p className="autorLivro">{livro.autor}</p>

                  <div className="rodapeCuradoria">
                    <span className="notaCuradoria">
                      <Star className="iconeEstrelaNota" size={15} fill="currentColor" />
                      {formatarNota(livro.nota)}
                    </span>

                    <button
                      id={`btnJaLiCuradoria-${livro.id}`}
                      type="button"
                      className={livro.jaLi ? 'btnJaLi ativo' : 'btnJaLi'}
                      onClick={() => alternarJaLiCuradoria(livro.id)}
                    >
                      <Check size={15} />
                      <span>Já li</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <hr className="divisorConteudo" />

        <section id="secaoEstante" className="secaoEstante">
          <div id="cabecalhoEstante" className="cabecalhoSecao">
            <div className="tituloSecaoGrupo">
              <p className="subtituloSecao">MINHA ESTANTE</p>
              <h2 className="tituloSecao">Seus livros, do seu jeito</h2>
            </div>

            <div id="abasEstante" className="abasEstante">
              <button
                id="btnAbaQueroLer"
                type="button"
                className={abaEstante === 'queroLer' ? 'abaEstante ativa' : 'abaEstante'}
                onClick={() => setAbaEstante('queroLer')}
              >
                <span>Quero ler</span>
                <span className="contadorAba">{totalQueroLer}</span>
              </button>

              <button
                id="btnAbaLidos"
                type="button"
                className={abaEstante === 'lidos' ? 'abaEstante ativa' : 'abaEstante'}
                onClick={() => setAbaEstante('lidos')}
              >
                <span>Lidos</span>
                <span className="contadorAba">{totalLidos}</span>
              </button>
            </div>
          </div>

          <div id="listaEstante" className="gridEstante">
            {livrosFiltrados.map((livro) => (
              <article
                key={livro.id}
                id={`cardEstante-${livro.id}`}
                className="cardLivroEstante"
              >
                <div className="capaEstante">
                  {livro.capaUrl ? (
                    <img
                      src={livro.capaUrl}
                      alt={livro.titulo}
                      className="capaEstanteImg"
                    />
                  ) : (
                    <div className="semCapaEstante">
                      <span>image</span>
                      <span>not</span>
                      <span>available</span>
                    </div>
                  )}
                </div>

                <div className="infoEstante">
                  <span className="categoriaLivro">{livro.categoria}</span>
                  <h3 className="tituloLivroEstante">{livro.titulo}</h3>
                  <p className="autorLivro">{livro.autor}</p>
                </div>

                <button
                  id={`btnRemoverEstante-${livro.id}`}
                  type="button"
                  className="btnRemoverEstante"
                  onClick={() => removerLivroEstante(livro.id)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}