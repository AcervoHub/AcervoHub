import { useState, type FormEvent } from 'react';
import '../styles/login.css';
import { BookOpen, ArrowRight } from 'lucide-react';

interface LoginProps {
    aoEntrar: (email: string, senha: string) => Promise<void>;
    aoCadastrar: (nome: string, email: string, senha: string) => Promise<void>;
}

export function Login({ aoEntrar, aoCadastrar }: LoginProps) {

    const [modo, setModo] = useState<'login' | 'cadastro'>('login');
    const [nomeCadastro, setNomeCadastro] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro(null);
        setEnviando(true);

        try {
            if (modo === 'login') {
                await aoEntrar(email.trim(), senha);
            } else {
                await aoCadastrar(nomeCadastro.trim(), email.trim(), senha);
            }
        } catch (error) {
            setErro(error instanceof Error ? error.message : 'Não foi possível entrar.');
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="loginContainer">

            <div className='catalogo'>

                <div className="iconeTitulo">
                    <BookOpen className="iconeBook" />
                    <h1 className="titulo">AcervoHub</h1>
                </div>

                <div className="conteudoCatalogo">

                    <p className='subText'>SUA BIBLIOTECA, SUAS HISTÓRIAS</p>
                    <h1 className='text'>Todo livro deixa uma marca entre as linhas.</h1>
                    <p className='subText2'>Organize suas próximas leituras, guarde os livros que já passaram por você e acompanhe sua jornada literária.</p>

                </div>

                <hr className='divisor' />

                <div className="conteudoCatalogo2">

                    <p className='epigrafe'>“A leitura é uma conversa silenciosa que continua muito depois da última página.”</p>
                </div>

            </div>

            <div className='ladoDireito'>

                <p className="subtituloTopo">
                    {modo === 'login' ? 'BEM-VINDO DE VOLTA' : 'COMECE SUA JORNADA'}
                </p>

                <h1>
                    {modo === 'login' ? 'Entre na sua biblioteca' : 'Crie sua conta'}
                </h1>

                <p className='subtituloTopo2'>
                    {modo === 'login' ? 'Acesse sua conta e continue sua jornada.' : 'Cadastre-se e comece a organizar suas leituras.'}
                </p>

                {erro && <p className='subtituloTopo2'>{erro}</p>}

                <div className='abasAuth'>

                    <button
                        type="button"
                        className={modo === 'login' ? 'aba ativa' : 'aba'}
                        onClick={() => setModo('login')}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={modo === 'cadastro' ? 'aba ativa' : 'aba'}
                        onClick={() => setModo('cadastro')}
                    >
                        Criar conta
                    </button>
                </div>

                {/* Formulário condicional */}
                {modo === 'login' ? (
                    <form className="formAuth" onSubmit={handleSubmit}>
                        <label>E-mail</label>
                        <input type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={enviando} />

                        <label>Senha</label>
                        <input type="password" placeholder="Digite sua senha" value={senha} onChange={(event) => setSenha(event.target.value)} required disabled={enviando} />

                        <button type="submit" className="btnPrincipal" disabled={enviando}>
                            {enviando ? 'Entrando...' : 'Entrar na biblioteca'} <ArrowRight size={18} />
                        </button>
                    </form>
                ) : (
                    <form className="formAuth" onSubmit={handleSubmit}>
                        <label>Nome completo</label>
                        <input type="text" placeholder="Seu nome" value={nomeCadastro} onChange={(event) => setNomeCadastro(event.target.value)} required disabled={enviando} />

                        <label>E-mail</label>
                        <input type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={enviando} />

                        <label>Senha</label>
                        <input type="password" placeholder="Crie uma senha" value={senha} onChange={(event) => setSenha(event.target.value)} required disabled={enviando} />

                        <button type="submit" className="btnPrincipal" disabled={enviando}>
                            {enviando ? 'Criando conta...' : 'Criar minha conta'} <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {/* Link de troca no rodapé */}
                <p className="trocaModo">
                    {modo === 'login' ? (
                        <>
                            Ainda não tem uma conta?{' '}
                            <button type="button" onClick={() => setModo('cadastro')}>
                                Cadastre-se
                            </button>
                        </>
                    ) : (
                        <>
                            Já tem uma conta?{' '}
                            <button type="button" onClick={() => setModo('login')}>
                                Entrar
                            </button>
                        </>
                    )}
                </p>

            </div>

        </div>
    )
}
