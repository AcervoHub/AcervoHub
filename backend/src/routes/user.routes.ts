import Router from 'express';
import { Cadastro, Login } from '../controllers/users/user.controller';
import authMiddleware from '../middlewares/auth.middleware';
// Criar sistema de rate limit

const userRoutes = Router();

userRoutes.post('/cadastro', Cadastro);
userRoutes.post('/login', Login);

export default userRoutes;