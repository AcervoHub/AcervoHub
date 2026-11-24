const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
const TOKEN_KEY = "acervohub.auth.token";
const USER_KEY = "acervohub.auth.user";

interface UsuarioApi {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  arroba: string;
  fotoUrl: string | null;
}

interface ErroApi {
  error?: string;
  message?: string;
}

export interface ResumoEstanteApi {
  total: number;
  totalPages: number;
  resultados: Array<{
    status: "queroLer" | "lidos";
    book: { pageCount: number | null };
  }>;
}

function obterToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function temSessao() {
  return Boolean(obterToken());
}

function salvarSessao(usuario: UsuarioSessao, token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function obterUsuarioSalvo(): UsuarioSessao | null {
  const salvo = sessionStorage.getItem(USER_KEY);
  if (!salvo) return null;

  try {
    return JSON.parse(salvo) as UsuarioSessao;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

export function limparSessao() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

async function requisicao<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = obterToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("Não foi possível conectar ao backend. Confira se a API está iniciada.");
  }

  const payload = (await response.json().catch(() => ({}))) as T & ErroApi;
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Não foi possível concluir a solicitação.");
  }
  return payload;
}

function mapearUsuario(usuario: UsuarioApi): UsuarioSessao {
  return {
    id: usuario.id,
    nome: usuario.name,
    email: usuario.email,
    arroba: `@${usuario.name}`,
    fotoUrl: usuario.avatarUrl ?? null,
  };
}

function gerarUsername(nome: string) {
  const username = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);

  return username.length >= 3 ? username : `leitor_${username}`.slice(0, 24);
}

export async function fazerLogin(email: string, password: string) {
  const resposta = await requisicao<{
    user: UsuarioApi;
    token: string;
  }>("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const usuario = mapearUsuario(resposta.user);
  salvarSessao(usuario, resposta.token);
  return usuario;
}

export async function fazerCadastro(nome: string, email: string, password: string) {
  await requisicao("/users/cadastro", {
    method: "POST",
    body: JSON.stringify({ username: gerarUsername(nome), email, password }),
  });

  // O endpoint de cadastro ainda não retorna token; autentica em seguida.
  return fazerLogin(email, password);
}

export async function buscarMeuPerfil() {
  const resposta = await requisicao<{ user: UsuarioApi }>("/users/me");
  const usuario = mapearUsuario(resposta.user);
  const token = obterToken();
  if (token) salvarSessao(usuario, token);
  return usuario;
}

export async function atualizarMeuPerfil(name: string) {
  const resposta = await requisicao<{ user: UsuarioApi }>("/users/update", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  const usuario = mapearUsuario(resposta.user);
  const token = obterToken();
  if (token) salvarSessao(usuario, token);
  return usuario;
}

export async function buscarResumoDaEstante(): Promise<ResumoEstanteApi> {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  const resposta = await requisicao<{
    total: number;
    totalPages: number;
    results: ResumoEstanteApi["resultados"];
  }>(`/books/my-books?${query.toString()}`);

  return {
    total: resposta.total,
    totalPages: resposta.totalPages,
    resultados: resposta.results,
  };
}
