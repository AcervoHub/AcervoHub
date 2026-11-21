import { Response } from "express";
import prisma from "../../lib/prisma";
import type { AuthRequest } from "../../middlewares/auth.middleware";
import { searchGoogleBooks, getGoogleBook } from "../../services/googleBooks.service";


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

    if (typeof result.results === "undefined" || result.results.length === 0) {
      return res.json(result);
    }
    const conditions = result.results.flatMap(catalogMatchConditions);

    if (!req.userId) {
      return res.status(401).json({
        error: "Usuário não autenticado.",
      });
    }

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

export default { searchBooks };