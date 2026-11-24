import { useState, type ComponentProps } from 'react';
import '../styles/login.css';
import { BookOpen, ArrowRight } from 'lucide-react';

export interface DadosLogin {
  email: string;
  senha: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  bio?: string;
}

export interface RespostaAutenticacao {
  usuario?: {
    id?: number | string;
    nome: string;
    arroba?: string;
    email?: string;
    bio?: string;
    fotoUrl?: string | null;
  };
  token?: string;
}

export interface LoginProps {
  aoEntrar?: (dados?: RespostaAutenticacao) => void;
  aoEnviarLogin?: (dados: DadosLogin) => Promise<RespostaAutenticacao | void> | RespostaAutenticacao | void;
  aoEnviarCadastro?: (dados: DadosCadastro) => Promise<RespostaAutenticacao | void> | RespostaAutenticacao | void;
}

type SubmitFormulario = NonNullable<ComponentProps<'form'>['onSubmit']>;

export function Login({
  aoEntrar,
  aoEnviarLogin,
  aoEnviarCadastro,
}: LoginProps) {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [bioCadastro, setBioCadastro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function limparErroAoTrocarModo(novoModo: 'login' | 'cadastro') {
    setErro(null);
    setModo(novoModo);
  }

  const handleLoginSubmit: SubmitFormulario = async (event) => {
    event.preventDefault();
    setErro(null);

    if (!emailLogin.trim() || !senhaLogin.trim()) {
      setErro('Preencha e-mail e senha para entrar.');
      return;
    }

    setEnviando(true);
    try {
      const payload: DadosLogin = {
        email: emailLogin.trim(),
        senha: senhaLogin,
      };
      const resposta = aoEnviarLogin ? await aoEnviarLogin(payload) : undefined;
      aoEntrar?.(resposta || { usuario: { nome: payload.email.split('@')[0] } });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar na conta.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCadastroSubmit: SubmitFormulario = async (event) => {
    event.preventDefault();
    setErro(null);

    if (!nomeCadastro.trim() || !emailCadastro.trim() || !senhaCadastro.trim()) {
      setErro('Preencha nome completo, e-mail e senha para criar sua conta.');
      return;
    }

    setEnviando(true);
    try {
      const bioLimpa = bioCadastro.trim();
      const payload: DadosCadastro = {
        nome: nomeCadastro.trim(),
        email: emailCadastro.trim(),
        senha: senhaCadastro,
        bio: bioLimpa || undefined,
      };
      const resposta = aoEnviarCadastro ? await aoEnviarCadastro(payload) : undefined;
      aoEntrar?.(
        resposta || {
          usuario: {
            nome: payload.nome,
            email: payload.email,
            bio: bioLimpa || undefined,
          },
        }
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div id="loginContainer" className="loginContainer">
      <div id="catalogoAuth" className="catalogo">
        <div id="marcaLogin" className="iconeTitulo">
          <BookOpen className="iconeBook" />
          <h1 className="titulo">AcervoHub</h1>
        </div>

        <div className="conteudoCatalogo">
          <p className="subText">SUA BIBLIOTECA, SUAS HISTÓRIAS</p>
          <h1 className="text">Todo livro deixa uma marca entre as linhas.</h1>
          <p className="subText2">
            Organize suas próximas leituras, guarde os livros que já passaram por você e acompanhe sua jornada literária.
          </p>
        </div>

        <hr className="divisor" />

        <div className="conteudoCatalogo2">
          <p className="epigrafe">
            “A leitura é uma conversa silenciosa que continua muito depois da última página.”
          </p>
        </div>
      </div>

      <div id="ladoDireitoAuth" className="ladoDireito">
        <p className="subtituloTopo">
          {modo === 'login' ? 'BEM-VINDO DE VOLTA' : 'COMECE SUA JORNADA'}
        </p>

        <h1 id="tituloAuth">
          {modo === 'login' ? 'Entre na sua biblioteca' : 'Crie sua conta'}
        </h1>

        <p className="subtituloTopo2">
          {modo === 'login'
            ? 'Acesse sua conta e continue sua jornada.'
            : 'Cadastre-se e comece a organizar suas leituras.'}
        </p>

        <div id="abasAuth" className="abasAuth">
          <button
            id="btnAbaLogin"
            type="button"
            className={modo === 'login' ? 'aba ativa' : 'aba'}
            onClick={() => limparErroAoTrocarModo('login')}
            disabled={enviando}
          >
            Entrar
          </button>
          <button
            id="btnAbaCadastro"
            type="button"
            className={modo === 'cadastro' ? 'aba ativa' : 'aba'}
            onClick={() => limparErroAoTrocarModo('cadastro')}
            disabled={enviando}
          >
            Criar conta
          </button>
        </div>

        {erro && (
          <p id="mensagemErroAuth" className="subtituloTopo2">
            {erro}
          </p>
        )}

        {modo === 'login' ? (
          <form id="formLogin" className="formAuth" onSubmit={handleLoginSubmit}>
            <label htmlFor="inputEmailLogin">E-mail</label>
            <input
              id="inputEmailLogin"
              type="email"
              placeholder="voce@exemplo.com"
              value={emailLogin}
              onChange={(e) => setEmailLogin(e.target.value)}
              disabled={enviando}
            />

            <label htmlFor="inputSenhaLogin">Senha</label>
            <input
              id="inputSenhaLogin"
              type="password"
              placeholder="Digite sua senha"
              value={senhaLogin}
              onChange={(e) => setSenhaLogin(e.target.value)}
              disabled={enviando}
            />

            <button
              id="btnSubmitLogin"
              type="submit"
              className="btnPrincipal"
              disabled={enviando}
            >
              {enviando ? 'Entrando...' : 'Entrar na biblioteca'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form id="formCadastro" className="formAuth" onSubmit={handleCadastroSubmit}>
            <label htmlFor="inputNomeCadastro">Nome completo</label>
            <input
              id="inputNomeCadastro"
              type="text"
              placeholder="Seu nome"
              value={nomeCadastro}
              onChange={(e) => setNomeCadastro(e.target.value)}
              disabled={enviando}
            />

            <label htmlFor="inputEmailCadastro">E-mail</label>
            <input
              id="inputEmailCadastro"
              type="email"
              placeholder="voce@exemplo.com"
              value={emailCadastro}
              onChange={(e) => setEmailCadastro(e.target.value)}
              disabled={enviando}
            />

            <label htmlFor="inputSenhaCadastro">Senha</label>
            <input
              id="inputSenhaCadastro"
              type="password"
              placeholder="Crie uma senha"
              value={senhaCadastro}
              onChange={(e) => setSenhaCadastro(e.target.value)}
              disabled={enviando}
            />

            <label htmlFor="inputBioCadastro">Sua bio</label>
            <textarea
              id="inputBioCadastro"
              rows={3}
              placeholder="Conte um pouco sobre suas leituras..."
              value={bioCadastro}
              onChange={(e) => setBioCadastro(e.target.value)}
              disabled={enviando}
            />

            <button
              id="btnSubmitCadastro"
              type="submit"
              className="btnPrincipal"
              disabled={enviando}
            >
              {enviando ? 'Criando conta...' : 'Criar minha conta'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        <p className="trocaModo">
          {modo === 'login' ? (
            <>
              Ainda não tem uma conta?{' '}
              <button
                id="btnTrocarParaCadastro"
                type="button"
                onClick={() => limparErroAoTrocarModo('cadastro')}
                disabled={enviando}
              >
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem uma conta?{' '}
              <button
                id="btnTrocarParaLogin"
                type="button"
                onClick={() => limparErroAoTrocarModo('login')}
                disabled={enviando}
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}