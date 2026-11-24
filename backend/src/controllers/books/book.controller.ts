import { Response } from "express";
import prisma from "../../lib/prisma.js";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";
import { searchGoogleBooks, getGoogleBook } from "../../services/googleBooks.service.js";
import { cache } from "../../lib/cache.js";
import { Prisma } from "../../../generated/prisma/client.js";

const userBookArgs = {
    include: {
        book: true
    }
} satisfies Prisma.UserBookDefaultArgs;

type UserBookWithBook = Prisma.UserBookGetPayload<
    typeof userBookArgs
>;

type PersonalFields = {
  status?: "QUERO_LER" | "LIDOS";
  isFavorite?: boolean;
  rating?: number | null;
  comment?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

interface UpdateProfileBody {
  name?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

const booksCacheTag = (userId: string) => `user-books:${userId}`;


function isObjectBody(body: unknown): body is Record<string, unknown> {
  return Boolean(body) && typeof body === 'object' && !Array.isArray(body);
}

function usuarioPublico<T extends { password: string | null }>(usuario: T) {
  const { password: _password, ...dados } = usuario;
  return dados;
}

function validatePersonalFields(body: Record<string, unknown>, requireAnyField = false): { value?: PersonalFields; error?: string } {
  const allowed = new Set(['status', 'isFavorite', 'rating', 'comment', 'startedAt', 'finishedAt']);
  if (Object.keys(body).some((key) => !allowed.has(key))) return { error: 'O registro contém campos não permitidos.' };
  if (requireAnyField && Object.keys(body).length === 0) return { error: 'Informe ao menos um campo para atualizar.' };

  if (body.status !== undefined && body.status !== "QUERO_LER" && body.status !== "LIDOS") {
    return { error: 'O status informado é inválido.' };
  }
  if (body.isFavorite !== undefined && typeof body.isFavorite !== 'boolean') return { error: 'isFavorite deve ser true ou false.' };

  if (body.rating !== undefined && body.rating !== null && (!Number.isInteger(body.rating) || (body.rating as number) < 1 || (body.rating as number) > 5)) {
    return { error: 'A nota deve ser um número inteiro de 1 a 5.' };
  }

  if (body.comment !== undefined && body.comment !== null && (typeof body.comment !== 'string' || body.comment.length > 5000)) {
    return { error: 'O comentário deve ter até 5000 caracteres.' };
  }

  for (const field of ['startedAt', 'finishedAt'] as const) {
    const date = body[field];
    if (date !== undefined && date !== null && (typeof date !== 'string' || Number.isNaN(Date.parse(date)))) {
      return { error: `A data ${field === 'startedAt' ? 'de início' : 'de conclusão'} é inválida.` };
    }
  }
  return { value: body as PersonalFields };
}

async function persistCatalogBook(metadata: Awaited<ReturnType<typeof getGoogleBook>>) {
  const conditions = catalogMatchConditions(metadata);
  const updateCatalogMatch = async (existing: Awaited<ReturnType<typeof prisma.book.findFirst>>) => {
    if (!existing) throw new Error('BOOK_CATALOG_MATCH_MISSING');
    const [isbn10Owner, isbn13Owner] = await Promise.all([
      metadata.isbn10 ? prisma.book.findUnique({ where: { isbn10: metadata.isbn10 }, select: { id: true } }) : null,
      metadata.isbn13 ? prisma.book.findUnique({ where: { isbn13: metadata.isbn13 }, select: { id: true } }) : null,
    ]);
    return prisma.book.update({
      where: { id: existing.id },
      data: {
        ...metadata,
        googleBooksId: existing.googleBooksId,
        isbn10: existing.isbn10 ?? (isbn10Owner && isbn10Owner.id !== existing.id ? null : metadata.isbn10),
        isbn13: existing.isbn13 ?? (isbn13Owner && isbn13Owner.id !== existing.id ? null : metadata.isbn13),
      },
    });
  };
  const existing = await prisma.book.findFirst({ where: { OR: conditions } });
  if (existing) return updateCatalogMatch(existing);
  try {
    return await prisma.book.create({ data: metadata });
  } catch (error) {
    // Two requests can add the same ISBN at the same time. Unique indexes are
    // the source of truth; re-read the winning catalog record after the race.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const racedBook = await prisma.book.findFirst({ where: { OR: conditions } });
      if (racedBook) return updateCatalogMatch(racedBook);
    }
    throw error;
  }
}

function serializeUserBook(entry: UserBookWithBook) {
    return {
        ...entry.book,
        description: entry.book.description ?? '',
        libraryId: entry.id,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
    };
}

function providerError(res: Response, error: unknown) {
  // so podemos comparar a mensagem diretamente quando o valor recebido é um Error.
  const code = error instanceof Error ? error.message : "";

  if (code === "BOOKS_NOT_CONFIGURED") {
    return res.status(503).json({
      error: "A busca de livros ainda não foi configurada no servidor.",
    });
  }

  if (code === "BOOKS_NOT_FOUND") {
    return res.status(404).json({
      error: "Livro não encontrado no Google Books.",
    });
  }

  if (code === "BOOKS_RATE_LIMITED") {
    return res.status(503).json({
      error: "O catálogo de livros está temporariamente indisponível. Tente novamente mais tarde.",
    });
  }

  if (code === "BOOKS_UNAVAILABLE" || code === "BOOKS_INVALID_RESPONSE") {
    return res.status(502).json({
      error: "Não foi possível consultar o catálogo de livros.",
    });
  }

  // timeouts são erros especiais enviados pelo fetch ou pelo navegador.
  if (error instanceof Error && error.name === "TimeoutError") {
    return res.status(504).json({
      error: "A busca de livros demorou demais. Tente novamente.",
    });
  }

  // erros nao previstos são registrados no servidor para facilitar a investigação.
  console.error("Erro na API de livros:", error);
  return res.status(500).json({
    error: "Erro interno ao consultar livros.",
  });
}

/*
 cria as condições usadas pelo Prisma para descobrir se um livro da busca
 já existe na biblioteca do usuário.
 um livro pode ser identificado pelo Google Books ID ou pelos ISBN-10/13.
 cada campo opcional só entra na pesquisa quando possui um valor.
 */
function catalogMatchConditions(metadata: Awaited<ReturnType<typeof getGoogleBook>>) {
  return [
    { googleBooksId: metadata.googleBooksId },
    ...(metadata.isbn10 ? [{ isbn10: metadata.isbn10 }] : []),
    ...(metadata.isbn13 ? [{ isbn13: metadata.isbn13 }] : []),
  ];
}

/*
 * valida um número inteiro recebido pela query string.
 * query params sempre chegam como texto, então o valor precisa ser convertido.
 */
function positiveInteger(value: unknown, fallback: number, max: number): number | null {
  // quando o parâmetro não foi enviado, usamos o valor padrão informado pelo controlador.
  if (value === undefined) return fallback;

  // rejeita números negativos, decimais e textos que não sejam somente dígitos.
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);

  // garante que o resultado seja seguro, positivo e dentro do limite permitido.
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : null;
}

const searchBooks = async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  const page = positiveInteger(req.query.page, 1, 100);

  if (typeof q !== "string" || q.trim().length < 2) {
    return res.status(400).json({
      error: "O parâmetro de busca deve ter pelo menos 2 caracteres.",
    });
  }
  if (q.length > 100) {
    return res.status(400).json({
      error: "O parâmetro de busca deve ter no máximo 100 caracteres.",
    });
  }
  // positiveInteger retorna null quando o valor informado nao é uma página válida.
  if (!page) {
    return res.status(400).json({
      error: "O parâmetro de página é inválido.",
    });
  }

  try {
    const result = await searchGoogleBooks(q, page);

    if (!req.userId) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

    if (typeof result.results === "undefined" || result.results.length === 0) {
      return res.json(result);
    }
    const conditions = result.results.flatMap(catalogMatchConditions);


    const existingBooks = await prisma.userBook.findMany({
      where: {
        userId: req.userId,
        book: {
          OR: conditions,
        },
      },
      select: {
        book: {
          select: {
            googleBooksId: true,
            isbn10: true,
            isbn13: true,
          },
        },
      },
    });

    /*
        set permite verificar rapidamente se um identificador ja esta presente na biblioteca.
        o filtro remove valores nulos e undefined.
     */
    const idsInLibrary = new Set(
      existingBooks.flatMap(({ book }) =>
        [book.googleBooksId, book.isbn10, book.isbn13].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    );

    // mantém os dados da busca e acrescenta inLibrary a cada livro encontrado.
    return res.json({
      ...result,
      results: result.results.map((book) => ({
        ...book,
        inLibrary:
          idsInLibrary.has(book.googleBooksId) ||
          Boolean(book.isbn10 && idsInLibrary.has(book.isbn10)) ||
          Boolean(book.isbn13 && idsInLibrary.has(book.isbn13)),
      })),
    });
  } catch (error) {
    return providerError(res, error);
  }
};


const addBook = async (req: AuthRequest, res: Response) => {
  if (!isObjectBody(req.body)) {
    return res.status(400).json({ error: 'Envie os dados do livro em formato JSON.' });
  }

  const { googleBooksId, ...personalFields } = req.body;

  if(typeof googleBooksId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(googleBooksId)) {
    return res.status(400).json({
      error: "O parâmetro googleBooksId é inválido.",
    });
  }
  const validation = validatePersonalFields(personalFields);
  if(validation.error) return res.status(400).json({ error: validation.error });

  const body = validation.value!;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  try {
    const metadata = await getGoogleBook(googleBooksId);

    if (metadata.googleBooksId !== googleBooksId) {
        return res.status(400).json({
            error: "O googleBooksId informado não corresponde ao livro retornado pelo Google Books."
        });
    }

    const book = await persistCatalogBook(metadata);

    const personalData = {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.isFavorite !== undefined ? { isFavorite: body.isFavorite } : {}),
        ...(body.rating !== undefined ? { rating: body.rating } : {}),
        ...(body.comment !== undefined ? { comment: body.comment?.trim() || null } : {}),
        ...(body.startedAt !== undefined ? { startedAt: body.startedAt ? new Date(body.startedAt) : null } : {}),
        ...(body.finishedAt !== undefined ? { finishedAt: body.finishedAt ? new Date(body.finishedAt) : null } : {}),
        ...(body.finishedAt !== undefined ? { status: body.finishedAt ? "LIDOS" as const : "QUERO_LER" as const } : {}),
    };

    const relation = {
        userId_bookId: {
            userId,
            bookId: book.id
        }
    };

    let entry = await prisma.userBook.findUnique({
        where: relation,
        include: { book: true }
    });

    if (entry) {
        if (Object.keys(personalData).length > 0) {
            entry = await prisma.userBook.update({
                where: relation,
                data: personalData,
                include: { book: true }
            });
        }
    } else {
        try {
            entry = await prisma.userBook.create({
                data: {
                    ...personalData,
                    userId,
                    bookId: book.id
                },
                include: { book: true }
            });

        } catch (error) {
            if (
                !(error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002')
            ) {
                throw error;
            }

            entry = await prisma.userBook.findUnique({
                where: relation,
                include: { book: true }
            });

            if (!entry) throw error;

            if (Object.keys(personalData).length > 0) {
                entry = await prisma.userBook.update({
                    where: relation,
                    data: personalData,
                    include: { book: true }
                });
            }
        }
    }

    if (!entry) throw new Error('BOOK_ENTRY_CREATE_FAILED');

    cache.invalidateTag(booksCacheTag(userId));

    return res.status(200).json(serializeUserBook(entry));

} catch (error) {
    return providerError(res, error);
}}

const getBooks = async (req: AuthRequest, res: Response) => {
  const page = positiveInteger(req.query.page, 1, 100);
  const pageSize = positiveInteger(req.query.pageSize, 20, 100);

  const favoriteParam = req.query.isFavorite;

  if (page === null || pageSize === null) {
    return res.status(400).json({
      error: 'Paginação inválida.'
    });
  }

  if (favoriteParam !== undefined && favoriteParam !== 'true' && favoriteParam !== 'false') {
    return res.status(400).json({
      error: 'O parâmetro isFavorite deve ser true ou false.'
    });
  }

  const isFavorite =
    favoriteParam === 'true'
      ? true
      : favoriteParam === 'false'
        ? false
        : undefined;

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      error: 'Usuário não autenticado.'
    });
  }

  const key = `user:${userId}:books:${isFavorite ?? 'all'}:${page}:${pageSize}`;

  try {
    const result = await cache.getOrLoad(key, 1000, async () => {

      const where = {
        userId,
        ...(isFavorite !== undefined ? { isFavorite } : {})
      };

      const [total, entries] = await Promise.all([
        prisma.userBook.count({
          where
        }),

        prisma.userBook.findMany({
          where,
          include: {
            book: true
          },
          skip: (page - 1) * pageSize,
          take: pageSize
        })
      ]);

      return {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        results: entries
      };
    }, [booksCacheTag(userId)]);

    return res.json(result);

  } catch (error) {
    return providerError(res, error);
  }
};

const UpdateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? (req.body as UpdateProfileBody)
        : null;

    if (!body) {
      return res.status(400).json({ error: "Requisição inválida." });
    }

    const { name, avatarUrl, bio } = body;

    if (name === undefined && avatarUrl === undefined && bio === undefined) {
      return res.status(400).json({ error: "Nenhum campo para atualizar." });
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res
        .status(400)
        .json({ error: "O nome deve ter de 2 a 80 caracteres." });
    }

    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      (typeof avatarUrl !== "string" || avatarUrl.length > 2048)
    ) {
      return res.status(400).json({ error: "A URL da foto é inválida" });
    }

    if (bio !== undefined && bio !== null && (typeof bio !== "string" || bio.length > 500)) {
      return res.status(400).json({ error: "A bio deve ter até 500 caracteres." });
    }
    if (typeof avatarUrl === "string") {
      try {
        const url = new URL(avatarUrl);
        const localDevelopmentUrl = "http://localhost:3000";

        if (url.protocol !== "https:" && !localDevelopmentUrl) {
          return res
            .status(400)
            .json({ error: "A URL da foto deve ser HTTPS." });
        }
      } catch (error) {
        return res.status(400).json({ error: "A URL da foto é inválida" });
      }
    }

    const usuarioAnterior = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!usuarioAnterior) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        avatarUrl: avatarUrl === undefined ? undefined : avatarUrl,
        bio: bio === undefined ? undefined : bio,
      },
    });

    const usuarioPublicoAtualizado = usuarioPublico(usuarioAtualizado);

    res.status(200).json({ user: usuarioPublicoAtualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export { searchBooks, addBook, getBooks, UpdateUser };
