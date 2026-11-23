import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import { generateToken } from "../../lib/jwt";
import { AuthRequest } from "../../middlewares/auth.middleware";

interface UpdateProfileBody {
  name?: string;
  avatarUrl?: string | null;
}

function sanitizeUserName(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/^@/, "").toLowerCase()
    : "";
}

function usernameIsValid(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

function usuarioPublico<T extends { password: string | null }>(usuario: T) {
  const { password: _password, ...dados } = usuario;
  return dados;
}

const Cadastro = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const sanitizedUsername = sanitizeUserName(username);

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !username
    ) {
      return res.status(400).json({ error: "Campos obrigatórios vazios!" });
    }
    if (
      sanitizedUsername.trim().length < 2 ||
      sanitizedUsername.trim().length > 80
    ) {
      return res
        .status(400)
        .json({ error: "O username deve ter de 2 a 80 caracteres." });
    }
    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ error: "Informe um e-mail válido." });
    }
    if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        error: "A senha deve ter ao menos 6 caracteres e no máximo 72 bytes.",
      });
    }
    if (!usernameIsValid(username)) {
      return res.status(400).json({
        error:
          "O username deve ter de 3 a 24 caracteres: letras, números ou _.",
      });
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalizado },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Este e-mail já está em uso." });
    }
    if (
      await prisma.user.findFirst({
        where: { name: sanitizedUsername },
        select: { id: true },
      })
    ) {
      return res.status(409).json({ error: "Esse username já está em uso." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: sanitizedUsername,
        email: emailNormalizado,
        password: hashedPassword,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.name,
    });

    res.status(201).json({
      message: "Usuário cadastrado",
      user: usuarioPublico(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      email.length > 254 ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({ error: "Campos obrigatórios vazios!" });
    }

    const emailNormalizado =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalizado },
    });

    if (!existingUser?.email || !existingUser?.password) {
      return res.status(401).json({ error: "Email ou senha incorreta" });
    }

    const comparePassword = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!comparePassword) {
      return res.status(401).json({ error: "Email ou senha incorreta" });
    }

    const token = generateToken({
      id: existingUser.id,
      email: existingUser.email,
      username: existingUser.name,
    });

    return res.status(200).json({
      user: usuarioPublico(existingUser),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const Me = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.status(200).json({ user: usuarioPublico(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor." });
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

    const { name, avatarUrl } = body;

    if (name === undefined && avatarUrl === undefined) {
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
      },
    });

    const usuarioPublicoAtualizado = usuarioPublico(usuarioAtualizado);

    res.status(200).json({ user: usuarioPublicoAtualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export { Cadastro, Login, Me, UpdateUser };
