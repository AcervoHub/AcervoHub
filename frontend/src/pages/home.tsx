import { House, Search, BookOpen, BarChart3, User, LogOut, ChevronRight } from 'lucide-react';
import '../styles/home.css';

interface UsuarioPerfil {
  nome: string;
  arroba: string;
  fotoUrl?: string | null;
}

function pegarIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function Home() {

  const usuario: UsuarioPerfil = {
    nome: 'Ana Oliveira',
    arroba: '@anaentrelinhas',
    fotoUrl: null,
  };

  return (
    <div className="container">
      <div className="menu">
        <div className="iconeTitulo">
          <BookOpen className="iconeBook" />
          <h1 className="titulo">AcervoHub</h1>
        </div>

        <div className="buttons">
          <button type="button" className="buttonHome">
            <House className="icone" />
            <span className="textButtons">Início</span>
          </button>

          <button type="button" className="buttonSearch">
            <Search className="icone" />
            <span className="textButtons">Pesquisar</span>
          </button>

          <button type="button" className="buttonDashboard">
            <BarChart3 className="icone" />
            <span className="textButtons">Dashboard</span>
          </button>

          <button type="button" className="buttonUser">
            <User className="icone" />
            <span className="textButtons">Meu perfil</span>
          </button>
        </div>

        <hr className="divisor" />

        <div className="perfilArea">
          <button type="button" className="perfilCard">
            <div className="avatar">
              {usuario.fotoUrl ? (
                <img
                  src={usuario.fotoUrl}
                  alt={`Foto de ${usuario.nome}`}
                  className="avatarImg"
                />
              ) : (
                <span>{pegarIniciais(usuario.nome)}</span>
              )}
            </div>

            <div className="perfilInfo">
              <span className="perfilNome">{usuario.nome}</span>
              <span className="perfilHandle">{usuario.arroba}</span>
            </div>

            <ChevronRight className="perfilSeta" size={18} />
          </button>
        </div>

        <div className="buttonsSecondary">
          <button type="button" className="buttonExit">
            <LogOut className="icone" />
            <span className="textButtons">Sair</span>
          </button>
        </div>
      </div>

      <div className="conteudo">
        <div className='headerDireito'>

          <div className='TextHeader'>

            <p className='subTituloHeader'>SUA BIBLIOTECA PESSOAL</p>
            <h1 className='tituloHeader'>Olá, Ana.</h1>
            <p className='subTituloHeader2'>Que história vamos descobrir hoje?</p>

          </div>

          <div className='headerButton'>

            <button type="button" className="buttonSearchHeader">
              <Search className="iconeHeader" />
              <span className="textButtonsHeader">Encontrar um livro</span>
            </button>

          </div>


        </div>

      </div>
    </div>
  );
}