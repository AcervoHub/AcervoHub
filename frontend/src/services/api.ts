const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
const TOKEN_KEY = "bookspace.auth.token";

export interface UsuarioApi {
  id: string;
  nome: string;
  email: string;
  arroba: string;
  fotoUrl: string | null;
}

export interface LivroCatalogoApi {
  googleBooksId: string;
  title: string;
  authors: string[];
  categories: string[];
  coverUrl: string | null;
  inLibrary: boolean;
}

export interface LivroEstanteApi {
  id: string;
  userId: string;
  bookId: string;
  isFavorite: boolean;
  rating: number | null;
  comment: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  book: {
    googleBooksId: string;
    title: string;
    authors: string[];
    categories: string[];
    coverUrl: string | null;
    pageCount: number | null;
  };
}

interface RespostaApi<T> {
  data: T;
}

interface RespostaErro {
  error?: string;
  message?: string;
}

function tokenAtual() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function encerrarSessaoApi() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function requisicao<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = tokenAtual();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("Não foi possível conectar à API. Verifique se o backend está iniciado.");
  }

  const payload = (await response.json().catch(() => ({}))) as T & RespostaErro;
  if (!response.ok) {
    if (response.status === 401) encerrarSessaoApi();
    throw new Error(payload.error || payload.message || "A solicitação não pôde ser concluída.");
  }
  return payload;
}

function mapearUsuario(user: { id: string; name: string; email: string; avatarUrl?: string | null }): UsuarioApi {
  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    arroba: `@${user.name}`,
    fotoUrl: user.avatarUrl ?? null,
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

function salvarToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export async function fazerLogin(email: string, senha: string) {
  const resposta = await requisicao<{
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
    token: string;
  }>("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password: senha }),
  });
  salvarToken(resposta.token);
  return mapearUsuario(resposta.user);
}

export async function fazerCadastro(nome: string, email: string, senha: string) {
  const resposta = await requisicao<{
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
    token?: string;
  }>("/users/cadastro", {
    method: "POST",
    body: JSON.stringify({ username: gerarUsername(nome), email, password: senha }),
  });

  // Login é o fallback para servidores que ainda não retornam o token no cadastro.
  if (!resposta.token) return fazerLogin(email, senha);
  salvarToken(resposta.token);
  const usuario = mapearUsuario(resposta.user);
  return { ...usuario, nome: nome.trim() };
}

export async function buscarLivros(termo: string) {
  const query = new URLSearchParams({ q: termo, page: "1" });
  return requisicao<{ results: LivroCatalogoApi[] }>(`/books/search?${query.toString()}`);
}

export async function buscarMinhaEstante() {
  const query = new URLSearchParams({ page: "1", pageSize: "100" });
  return requisicao<{ results: LivroEstanteApi[]; total: number }>(`/books/my-books?${query.toString()}`);
}

export async function atualizarLivro(
  googleBooksId: string,
  dados: { isFavorite?: boolean; finishedAt?: string | null },
) {
  return requisicao(`/books/add`, {
    method: "POST",
    body: JSON.stringify({ googleBooksId, ...dados }),
  });
}

export type { RespostaApi };
