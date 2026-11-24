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
  Library,
  BookHeart,
} from 'lucide-react';
import '../styles/dashboard.css';

export interface UsuarioPerfil {
  id?: number | string;
  nome: string;
  arroba: string;
  fotoUrl?: string | null;
}

export interface ResumoDashboard {
  livrosLidos: number;
  paginasLidas: number;
  filaLeitura: number;
}

export type RotaMenu = 'home' | 'search' | 'dashboard' | 'perfil';

export interface DashboardProps {
  usuario?: UsuarioPerfil | null;
  resumo?: ResumoDashboard | null;
  buscarDadosDashboard?: () => Promise<{
    usuario?: UsuarioPerfil;
    resumo?: ResumoDashboard;
  }>;
  aoNavegar?: (rota: RotaMenu) => void;
  aoSair?: () => void;
}

function pegarIniciais(nome?: string) {
  if (!nome || !nome.trim()) return 'AC';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function Dashboard({
  usuario: usuarioInicial = null,
  resumo: resumoInicial = null,
  buscarDadosDashboard,
  aoNavegar,
  aoSair,
}: DashboardProps) {
  const usuario = usuarioInicial;
  const [livrosLidos, setLivrosLidos] = useState<number>(resumoInicial?.livrosLidos ?? 0);
  const [paginasLidas, setPaginasLidas] = useState<number>(resumoInicial?.paginasLidas ?? 0);
  const [filaLeitura, setFilaLeitura] = useState<number>(resumoInicial?.filaLeitura ?? 0);
  const [carregando, setCarregando] = useState<boolean>(Boolean(buscarDadosDashboard));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      if (!buscarDadosDashboard) {
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro(null);

      try {
        const dados = await buscarDadosDashboard();
        if (!ativo) return;

        if (dados.resumo) {
          setLivrosLidos(dados.resumo.livrosLidos);
          setPaginasLidas(dados.resumo.paginasLidas);
          setFilaLeitura(dados.resumo.filaLeitura);
        }
      } catch {
        if (!ativo) return;
        setErro('Não foi possível carregar os dados do dashboard.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, [buscarDadosDashboard]);

  const nomeExibicao = usuario?.nome?.trim() ? usuario.nome : 'Usuário';
  const arrobaExibicao = usuario?.arroba?.trim() ? usuario.arroba : '@leitor';

  return (
    <div id="dashContainer" className="container">
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
            <Search className="icone" />
            <span className="textButtons">Pesquisar</span>
          </button>

          <button
            id="btnNavDashboard"
            type="button"
            className="buttonDashboard ativo"
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
        <div id="cabecalhoDashboard" className="headerDireito">
          <div className="TextHeader">
            <p className="subTituloHeader">SEU ANO EM LIVROS</p>
            <h1 id="tituloDashboard" className="tituloHeader">
              Dashboard de leitura
            </h1>
            <p className="subTituloHeader2">
              Acompanhe seu ritmo e celebre cada página lida.
            </p>
          </div>
        </div>

        {erro && (
          <p id="mensagemErroDashboard" className="subTituloHeader2">
            {erro}
          </p>
        )}

        <div id="resumoLeitura" className="resumoLeitura">
          <div id="cardLivrosLidos" className="livrosLidos">
            <BookCheck className="iconeLido" />

            <div className="conteudoResumo">
              <h1 id="valorLivrosLidos" className="quantidade">
                {carregando ? '-' : livrosLidos}
              </h1>
              <p className="textResumo">Livros lidos</p>
            </div>
          </div>

          <div id="cardPaginasLidas" className="PaginasLidas">
            <Library className="iconePagLidas" />

            <div className="conteudoResumo">
              <h1 id="valorPagLidas" className="quantidade">
                {carregando ? '-' : paginasLidas}
              </h1>
              <p className="textResumo">Páginas lidas</p>
            </div>
          </div>

          <div id="cardFilaLeitura" className="FilaLeitura">
            <BookHeart className="iconeFilaLeitura" />

            <div className="conteudoResumo">
              <h1 id="valorFilaLeitura" className="quantidade">
                {carregando ? '-' : filaLeitura}
              </h1>
              <p className="textResumo">Na fila de leitura</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
