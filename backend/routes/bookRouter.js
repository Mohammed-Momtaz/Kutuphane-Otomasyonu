import express from 'express';
import {
    createBook,
    getAllBooks,
    getBookDetails,
    updateBook,
    deleteBook,
    borrowBook,
    returnBook,
    getMyBorrowedBooks,
    getAllBorrowings,
    getOverdueBooks
} from '../controllers/bookController.js';
import { isAuthenticated, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- Kitap Yönetimi Rotaları (Sadece Admin) ---
// Adminler kitap ekleyebilir, güncelleyebilir ve silebilir
router.post('/book/new', isAuthenticated, authorizeRoles('admin'), createBook);
router.put('/book/:id', isAuthenticated, authorizeRoles('admin'), updateBook);
router.delete('/book/:id', isAuthenticated, authorizeRoles('admin'), deleteBook);

// --- Kitap Listeleme/Detay Rotaları (Herkese Açık veya Oturum Açmış) ---
// Herkes tüm kitapları listeleyebilir ve detaylarını görebilir.
router.get('/books', getAllBooks);
router.get('/book/:id', getBookDetails);

// --- Ödünç Alma / İade Rotaları (Sadece Oturum Açmış Kullanıcılar) ---
// Kullanıcılar kitap ödünç alabilir
router.post('/book/borrow', isAuthenticated, borrowBook);
// Kullanıcılar ödünç aldıkları kitabı iade edebilir
router.post('/book/return', isAuthenticated, returnBook);
// Kullanıcılar kendi ödünç aldıkları kitapları listeleyebilir
router.get('/me/borrowed-books', isAuthenticated, getMyBorrowedBooks);

// --- Admin için Tüm Ödünç Alma Kayıtları ---
// Adminler tüm ödünç alma kayıtlarını görebilir
router.get('/admin/borrowings', isAuthenticated, authorizeRoles('admin'), getAllBorrowings);

// --- Admin için Geciken Kitaplar Rotaları ---
// Sadece adminler geciken kitapları listeleyebilir
router.get('/admin/overdue-books', isAuthenticated, authorizeRoles('admin'), getOverdueBooks);

export default router;