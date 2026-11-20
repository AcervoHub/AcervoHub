import { useState } from 'react';
import '../styles/login.css';
import { BookOpen, Mail, Lock, User, ArrowRight } from 'lucide-react';

export function Login() {

    const [modo, setModo] = useState<'login' | 'cadastro'>('login');

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
                    <form className="formAuth">
                        <label>E-mail</label>
                        <input type="email" placeholder="voce@exemplo.com" />

                        <label>Senha</label>
                        <input type="password" placeholder="Digite sua senha" />

                        <button type="submit" className="btnPrincipal">
                            Entrar na biblioteca <ArrowRight size={18} />
                        </button>
                    </form>
                ) : (
                    <form className="formAuth">
                        <label>Nome completo</label>
                        <input type="text" placeholder="Seu nome" />

                        <label>E-mail</label>
                        <input type="email" placeholder="voce@exemplo.com" />

                        <label>Senha</label>
                        <input type="password" placeholder="Crie uma senha" />

                        <button type="submit" className="btnPrincipal">
                            Criar minha conta <ArrowRight size={18} />
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