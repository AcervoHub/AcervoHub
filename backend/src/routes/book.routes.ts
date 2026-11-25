import { Router } from "express";
import { searchBooks, addBook, getBooks, removeBook } from "../controllers/books/book.controller.js";

const bookRoutes = Router();

bookRoutes.get('/search', searchBooks);
bookRoutes.post('/add', addBook);
bookRoutes.get('/my-books', getBooks);
bookRoutes.put('/delete', removeBook);

// teste

export default bookRoutes;
