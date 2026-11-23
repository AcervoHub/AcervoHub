import Router from 'express';
import { Cadastro, Login, Me, UpdateUser } from '../controllers/users/user.controller';
import authMiddleware from '../middlewares/auth.middleware';
// Criar sistema de rate limit

const userRoutes = Router();

userRoutes.post('/cadastro', Cadastro);
userRoutes.post('/login', Login);
userRoutes.get('/me', authMiddleware, Me);
userRoutes.put('/update', authMiddleware, UpdateUser);

export default userRoutes;