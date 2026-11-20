import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@prisma/client';
import { generateTokens } from '../../lib/jwt';


function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

function sanitizeUserName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/^@/, '').toLowerCase() : '';
}

function usernameIsValid(username: string): boolean {
    return /^[a-z0-9_]{3,24}$/.test(username);
}

const Cadastro = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const username = sanitizeUserName(req.body?.username);

     if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !username) {
      return res.status(400).json({ error: "Campos obrigatórios vazios!" });
    }
    if (name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({ error: 'O nome deve ter de 2 a 80 caracteres.' });
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    if (password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'A senha deve ter ao menos 6 caracteres e no máximo 72 bytes.' });
    }
    if (!usernameIsValid(username)) {
      return res.status(400).json({ error: 'O username deve ter de 3 a 24 caracteres: letras, números ou _.' });
    }

    const emailNormalizado = String(email).trim().toLowerCase();
    // const existingUser = await prisma.user.findUnique({
    //      where: { email: emailNormalizado } 
    //     });
    // if (existingUser) {
    //   return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    // }
    //  if (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
    //   return res.status(409).json({ error: 'Esse username já está em uso.' });
    // }

    const hashedPassword = await bcrypt.hash(password, 10);

    // const user = await prisma.user.create({
    //   data: {
    //     name: name.trim(),
    //     username,
    //     email: emailNormalizado,
    //     password: hashedPassword,
    //   },
    // });

    // const token = generateTokens({
    //         id: user.id,
    //         email: user.email,
    //         username: user.username
    //     });

    //     delete user.password;

    //     res.status(201).json({
    //         message: "Usuário cadastrado",
    //         user
    //     });
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || !email.trim() || !password || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: "Campos obrigatórios vazios!" });
    }

    // const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';
    // const existingUser = await prisma.user.findUnique({
    //   where: { email: emailNormalizado },
    // });

    // if (!existingUser?.email || !existingUser?.password) {
    //   return res.status(401).json({ error: "Email ou senha incorreta" });
    // }

    // const comparePassword = await bcrypt.compare(
    //   password,
    //   existingUser.password,
    // );

    // if (!comparePassword) {
    //     return res.status(401).json({ error: "Email ou senha incorreta" });

    // const token = generateTokens({
    //         id: existingUser.id,
    //         email: existingUser.email,
    //         username: existingUser.username
    //     });
  
    // delete existingUser.password;

    // return res.status(200).json({
    //    user: existingUser, 
    //    token });
  }catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

export { Cadastro, Login };