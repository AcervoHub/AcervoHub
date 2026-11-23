import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const match =  /^Bearer ([^\s]+)$/i.exec(authHeader); 
    // Cria verificação de acordo com padrão Bearer <token> e captura o token em um grupo de captura, comandos esclarecidos na documentação do backend

    if (!match) {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }     

    try {
    const secret = process.env.JWT_SECRET; // chave secreta para verificar o token, localizada no arquivo .env
    if (!secret) return res.status(503).json({ error: "Autenticação indisponível." }); // verifica se a chave secreta está disponível, caso não esteja, retorna erro 503 (serviço indisponível)

    const payload = jwt.verify(match[1]!, secret, { algorithms: ["HS256"] }); // verifica o token usando a chave secreta e o algoritmo HS256, caso seja inválido ou expirado, lança uma exceção que será capturada no bloco catch
    if (typeof payload === "string" || typeof payload.userId !== "string") {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    } // verifica se o payload é uma string ou se o userId não é uma string, caso seja, retorna erro 401 (não autorizado)
    req.userId = payload.userId; // adiciona o userId ao objeto de requisição para que possa ser acessado em outros middlewares ou controladores
    next(); // chama a função next() para passar para o próximo middleware ou controlador
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export default authMiddleware;