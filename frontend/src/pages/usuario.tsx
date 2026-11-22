
import {
    House,
    Search,
    BookOpen,
    BarChart3,
    User,
    LogOut,
    ChevronRight,
} from 'lucide-react';
import '../styles/usuario.css';
import { useNavigate } from 'react-router-dom';

export interface UsuarioPerfil {
    id?: number | string;
    nome: string;
    arroba: string;
    fotoUrl?: string | null;
}

export type RotaMenu = 'home' | 'search' | 'dashboard' | 'perfil';

export interface DashboardProps {
    usuario?: UsuarioPerfil | null;
    aoNavegar?: (rota: RotaMenu) => void;
    aoSair?: () => void;
}

function pegarIniciais(nome?: string) {
    if (!nome || !nome.trim()) return 'AC';

    const partes = nome.trim().split(/\s+/);

    if (partes.length === 1) {
        return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function Usuario({
    usuario = null,
    aoNavegar,
    aoSair,
}: DashboardProps) {

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
                            <span id="perfilUsuarioNome" className="perfilNome">
                                {nomeExibicao}
                            </span>

                            <span id="perfilUsuarioArroba" className="perfilHandle">
                                {arrobaExibicao}
                            </span>
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
        </div>
    );
}
