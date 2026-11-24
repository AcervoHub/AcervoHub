import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { generateToken } from "../../lib/jwt.js";
import type { AuthRequest } from "../../middlewares/auth.middleware.js";

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
      return res
        .status(400)
        .json({
          error: "A senha deve ter ao menos 6 caracteres e no máximo 72 bytes.",
        });
    }
    if (!usernameIsValid(username)) {
      return res
        .status(400)
        .json({
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

    return res.status(201).json({
      message: "Usuário cadastrado",
      user: usuarioPublico(user),
      token,
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
    if (!req.userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.status(200).json({ user: usuarioPublico(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const UpdateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? (req.body as { name?: unknown; avatarUrl?: unknown; bio?: unknown })
        : null;
    if (!body) {
      return res.status(400).json({ error: "Requisição inválida." });
    }

    const { name, avatarUrl, bio } = body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res
        .status(400)
        .json({ error: "O nome deve ter de 2 a 80 caracteres." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      (typeof avatarUrl !== "string" || avatarUrl.length > 2048)
    ) {
      return res.status(400).json({ error: "A URL da foto é inválida." });
    }

    if (bio !== undefined && bio !== null && (typeof bio !== "string" || bio.length > 500)) {
      return res.status(400).json({ error: "A bio deve ter até 500 caracteres." });
    }

    if (typeof avatarUrl === "string") {
      try {
        const url = new URL(avatarUrl);
        if (url.protocol !== "https:" && url.hostname !== "localhost") {
          return res
            .status(400)
            .json({ error: "A URL da foto deve ser HTTPS." });
        }
      } catch {
        return res.status(400).json({ error: "A URL da foto é inválida." });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl === undefined ? undefined : avatarUrl,
        bio: bio === undefined ? undefined : bio,
      },
    });

    return res.status(200).json({ user: usuarioPublico(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

export { Cadastro, Login, Me, UpdateUser };
