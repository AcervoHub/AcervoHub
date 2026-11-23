import { Router } from 'express';
import { Cadastro, Login } from '../controllers/users/user.controller.js';

const userRoutes = Router();

userRoutes.post('/cadastro', Cadastro);
userRoutes.post('/login', Login);

export default userRoutes;
