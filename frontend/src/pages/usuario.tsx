import { useEffect, useState, type FormEvent } from 'react';
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

export interface UsuarioPerfil {
    id?: number | string;
    nome: string;
    arroba: string;
    email?: string;
    bio?: string;
    fotoUrl?: string | null;
}

export interface ResumoUsuario {
    livrosLidos: number;
    queroLer: number;
}

export type RotaMenu = 'home' | 'search' | 'dashboard' | 'perfil';

export interface UsuarioProps {
    usuario?: UsuarioPerfil | null;
    resumo?: ResumoUsuario | null;
    buscarDadosUsuario?: () => Promise<{
        usuario?: UsuarioPerfil;
        resumo?: ResumoUsuario;
    }>;
    aoSalvarPerfil?: (dados: {
        nome: string;
        arroba: string;
        bio: string;
    }) => Promise<void> | void;
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
    usuario: usuarioInicial = null,
    resumo: resumoInicial = null,
    buscarDadosUsuario,
    aoSalvarPerfil,
    aoNavegar,
    aoSair,
}: UsuarioProps) {
    const [usuario, setUsuario] = useState<UsuarioPerfil | null>(usuarioInicial);
    const [totalLidos, setTotalLidos] = useState<number>(resumoInicial?.livrosLidos ?? 0);
    const [totalQueroLer, setTotalQueroLer] = useState<number>(resumoInicial?.queroLer ?? 0);

    const [nomeForm, setNomeForm] = useState<string>(usuarioInicial?.nome ?? '');
    const [arrobaForm, setArrobaForm] = useState<string>(usuarioInicial?.arroba ?? '');
    const [bioForm, setBioForm] = useState<string>(usuarioInicial?.bio ?? '');

    const [carregando, setCarregando] = useState<boolean>(Boolean(buscarDadosUsuario));
    const [salvando, setSalvando] = useState<boolean>(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;

        async function carregarPerfil() {
            if (!buscarDadosUsuario) {
                setCarregando(false);
                return;
            }

            setCarregando(true);
            setErro(null);

            try {
                const dados = await buscarDadosUsuario();
                if (!ativo) return;

                if (dados.usuario) {
                    setUsuario(dados.usuario);
                    setNomeForm(dados.usuario.nome ?? '');
                    setArrobaForm(dados.usuario.arroba ?? '');
                    setBioForm(dados.usuario.bio ?? '');
                }
                if (dados.resumo) {
                    setTotalLidos(dados.resumo.livrosLidos);
                    setTotalQueroLer(dados.resumo.queroLer);
                }
            } catch {
                if (!ativo) return;
                setErro('Não foi possível carregar os dados do perfil.');
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregarPerfil();

        return () => {
            ativo = false;
        };
    }, [buscarDadosUsuario]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSalvando(true);
        setErro(null);

        const nomeLimpo = nomeForm.trim();
        const arrobaLimpo = arrobaForm.trim();
        const arrobaFormatado = arrobaLimpo
            ? arrobaLimpo.startsWith('@')
                ? arrobaLimpo
                : `@${arrobaLimpo}`
            : '@leitor';
        const bioLimpa = bioForm.trim();

        try {
            await aoSalvarPerfil?.({
                nome: nomeLimpo,
                arroba: arrobaFormatado,
                bio: bioLimpa,
            });

            setUsuario((anterior) => ({
                ...anterior,
                nome: nomeLimpo,
                arroba: arrobaFormatado,
                bio: bioLimpa,
            }));
        } catch {
            setErro('Não foi possível salvar as alterações.');
        } finally {
            setSalvando(false);
        }
    }

    const nomeExibicao = usuario?.nome?.trim() ? usuario.nome : 'Usuário';
    const arrobaExibicao = usuario?.arroba?.trim() ? usuario.arroba : '@leitor';

    return (
        <div id="usuarioContainer" className="container">
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
                        className="buttonDashboard"
                        onClick={() => aoNavegar?.('dashboard')}
                    >
                        <BarChart3 className="icone" />
                        <span className="textButtons">Dashboard</span>
                    </button>

                    <button
                        id="btnNavPerfil"
                        type="button"
                        className="buttonUser ativo"
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

            <div id="conteudoPrincipal" className="conteudo">

                <div id="cabecalhoPerfil" className="headerPerfil">

                    <div className="infoUsuario">

                        <div className="avatarHeader">
                            {usuario?.fotoUrl ? (
                                <img
                                    src={usuario.fotoUrl}
                                    alt={`Foto de ${nomeExibicao}`}
                                    className="avatarImgHeader"
                                />
                            ) : (
                                <span>{pegarIniciais(nomeExibicao)}</span>
                            )}

                        </div>

                        <div className="infoEscrita">

                            <p className="subTextHeader">Meu perfil</p>
                            <span id="perfilHeaderNome" className="perfilNome">
                                {nomeExibicao}
                            </span>
                            <span id="perfilHeaderArroba" className="perfilHandle">
                                {arrobaExibicao}
                            </span>

                        </div>

                        <div className="infoHeaderLidosLer">

                            <div className="headerLido">

                                <h1 id="valorLivrosLidos" className="quantidade">
                                    {carregando ? '-' : totalLidos}
                                </h1>
                                <p>Lidos</p>

                            </div>

                            <div className="headerLer">

                                <h1 id="valorQueroLer" className="quantidade">
                                    {carregando ? '-' : totalQueroLer}
                                </h1>
                                <p>Desejos</p>

                            </div>
                        </div>
                    </div>
                </div>

                <div className='main'>

                    <div className="article">

                        <p className="subTextHeader">Informações pessoais</p>
                        <h1 className="tituloArticle">Sobre você</h1>

                        <form id="formPerfilUsuario" className="formPerfil" onSubmit={handleSubmit}>
                            <div className="campoForm">
                                <label htmlFor="campoNomeUsuario">Nome</label>
                                <input
                                    id="campoNomeUsuario"
                                    type="text"
                                    value={nomeForm}
                                    onChange={(e) => setNomeForm(e.target.value)}
                                    disabled={carregando || salvando}
                                />
                            </div>

                            <div className="campoForm">
                                <label htmlFor="campoArrobaUsuario">Nome de usuário</label>
                                <input
                                    id="campoArrobaUsuario"
                                    type="text"
                                    value={arrobaForm}
                                    onChange={(e) => setArrobaForm(e.target.value)}
                                    disabled={carregando || salvando}
                                />
                            </div>

                            <div className="campoForm">
                                <label htmlFor="campoBioUsuario">Sua bio</label>
                                <textarea
                                    id="campoBioUsuario"
                                    rows={4}
                                    value={bioForm}
                                    onChange={(e) => setBioForm(e.target.value)}
                                    disabled={carregando || salvando}
                                />
                            </div>

                            <button
                                id="btnSalvarPerfil"
                                type="submit"
                                className="btnSalvarPerfil"
                                disabled={carregando || salvando}
                            >
                                {salvando ? 'Salvando...' : 'Salvar alterações'}
                            </button>
                        </form>


                    </div>
                    <div className='section'>

                        <div className='minhaHistoria'>

                            <p className='subTextHeader'>Minha história</p>
                            <p className='subTextSection'>“Leitora de histórias sensíveis, cafés demorados e finais que ficam.”</p>

                        </div>
                    </div>


                </div>


                {erro && (
                    <p id="mensagemErroPerfil" className="subTextHeader">
                        {erro}
                    </p>
                )}
            </div>
        </div>
    );
}