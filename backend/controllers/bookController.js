import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { Book } from "../models/bookModel.js";
import { User } from "../models/userModel.js";
import { Borrowing } from "../models/borrowingModel.js";

// --- Yeni Kitap Ekleme (Admin Yetkisi Gerekir) ---
export const createBook = catchAsyncErrors(async (req, res, next) => {
    try {
        // Kitabı ekleyen kullanıcının ID'sini `req.user`'dan alıyoruz (isAuthenticated middleware'i tarafından eklenir).
        // `req.user` JWT doğrulandıktan sonra oturum açmış kullanıcının bilgilerini içerir.
        req.body.addedBy = req.user.id;
        // `stock` ve `borrowedCount` başlangıç değerlerini kontrol et
        // Eğer `stock` req.body'de gelmezse varsayılan olarak 0 olacak (modelde default var)
        // `borrowedCount` her zaman yeni bir kitap eklenirken 0 olmalı.
        if (req.body.borrowedCount !== undefined && req.body.borrowedCount > 0) {
            return next(new ErrorHandler("Yeni bir kitap eklenirken 'borrowedCount' 0 olmalıdır.", 400));
        }
        req.body.borrowedCount = 0; // Manuel olarak 0'a set edelim, emin olmak için
        const book = await Book.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Kitap başarıyla eklendi!',
            book,
        });
    } catch (error) {
        return next(new ErrorHandler(`Kitap eklerken hata oluştu ${error}`, 500));
    };
});

// --- Tüm Kitapları Listeleme ---
export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
    // Sayfalama, arama ve filtreleme gibi özellikler buraya eklenebilir.
    // Örneğin, sadece mevcut kitapları listelemek için: { 'stock': { $gt: 0 } }
    const books = await Book.find().populate('addedBy', 'name'); // Kitabı ekleyen kullanıcının adını getir

    res.status(200).json({
        success: true,
        books,
        count: books.length,
    });
});

// --- Tek Bir Kitabı Detaylarıyla Getirme ---
export const getBookDetails = catchAsyncErrors(async (req, res, next) => {
    const book = await Book.findById(req.params.id).populate('addedBy', 'name');

    if (!book) {
        return next(new ErrorHandler('Kitap bulunamadı!', 404));
    }

    res.status(200).json({
        success: true,
        book,
    });
});

// --- Kitap Bilgilerini Güncelleme (Admin Yetkisi Gerekir) ---
export const updateBook = catchAsyncErrors(async (req, res, next) => {
    let book = await Book.findById(req.params.id);
    if (!book) {
        return next(new ErrorHandler('Güncellenecek kitap bulunamadı!', 404));
    }
    // `stock` ve `borrowedCount` alanlarını doğrudan `req.body`'den güncellemeyi engelle.
    // Bu alanlar ödünç alma/iade işlemleriyle otomatik güncellenmeli.
    const { stock, borrowedCount, ...otherUpdateFields } = req.body;
    // Eğer `stock` güncelleniyorsa, `borrowedCount`'tan az olamayacağını kontrol et
    if (stock !== undefined && stock < book.borrowedCount) {
        return next(new ErrorHandler("Güncel stok, ödünç verilen kitap sayısından az olamaz.", 400));
    }
    // Diğer alanları güncelle (title, author, description vb.)
    book = await Book.findByIdAndUpdate(req.params.id, otherUpdateFields, {
        new: true,
        runValidators: true, // Schema validasyonlarını çalıştır
        useFindAndModify: false,
    });
    book.stock = stock;
    await book.save(); // Güncellenen kitabı kaydet
    res.status(200).json({
        success: true,
        message: 'Kitap başarıyla güncellendi!',
        book,
    });
});

// --- Kitap Silme (Admin Yetkisi Gerekir) ---
export const deleteBook = catchAsyncErrors(async (req, res, next) => {
    const book = await Book.findById(req.params.id);

    if (!book) {
        return next(new ErrorHandler('Silinecek kitap bulunamadı!', 404));
    }

    // Kitabın ödünç alınıp alınmadığını kontrol et
    if (book.borrowedCount > 0) {
        return next(new ErrorHandler('Bu kitap ödünç alındığı için silinemez. Önce tüm kopyalar iade edilmeli.', 400));
    }

    await book.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Kitap başarıyla silindi!',
    });
});

// --- Kitap Ödünç Alma Fonksiyonu (Kullanıcılar İçin) ---
export const borrowBook = catchAsyncErrors(async (req, res, next) => {
    console.log("Request Body:", req.body);
    const { bookId, returnDate } = req.body; // `returnDate` (teslim tarihi), istemciden gelmeli

    if (!bookId || !returnDate) {
        return next(new ErrorHandler('Kitap ID ve teslim tarihi zorunludur.', 400));
    }

    const book = await Book.findById(bookId);

    if (!book) {
        return next(new ErrorHandler('Ödünç alınacak kitap bulunamadı!', 404));
    }

    // Yeterli stok var mı kontrol et
    if (book.stock - book.borrowedCount <= 0) {
        return next(new ErrorHandler('Bu kitabın mevcut kopyası kalmadı. Lütfen daha sonra tekrar deneyin.', 400));
    }

    // `returnDate`'in geçerli bir tarih olduğundan ve geçmişte olmadığından emin ol
    const parsedReturnDate = new Date(returnDate);
    if (isNaN(parsedReturnDate.getTime())) { // Geçersiz tarih formatı
        return next(new ErrorHandler('Geçerli bir teslim tarihi formatı girin (örn: YYYY-MM-DD).', 400));
    }
    if (parsedReturnDate <= Date.now()) { // Teslim tarihi geçmişte veya şu an olamaz
        return next(new ErrorHandler('Teslim tarihi gelecekte olmalı.', 400));
    }

    // Kullanıcının bu kitabı zaten ödünç alıp almadığını kontrol et
    // (Aynı kitaptan birden fazla kopya ödünç almasına izin vermek istemiyorsanız)
    const existingBorrowing = await Borrowing.findOne({
        user: req.user.id,
        book: bookId,
        status: 'borrowed' // Henüz iade edilmemiş
    });

    if (existingBorrowing) {
        return next(new ErrorHandler('Bu kitabı zaten ödünç almışsınız. Lütfen önce mevcut kopyayı iade edin.', 400));
    }

    // Yeni ödünç alma kaydını oluştur
    const borrowing = await Borrowing.create({
        book: bookId,
        user: req.user.id, // Ödünç alan kullanıcı (`isAuthenticated` middleware'i tarafından eklenir)
        returnDate: parsedReturnDate,
        status: 'borrowed'
    });

    // Kitabın ödünç sayısını artır
    book.borrowedCount += 1;
    await book.save({ validateBeforeSave: false }); // `borrowedCount` validatörü burada devreye girmediği için false.
    // Eğer `book.stock`tan fazlasını ödünç almaya çalışırsan,
    // yukarıdaki `if (book.stock - book.borrowedCount <= 0)` kontrolü bunu yakalar.

    res.status(200).json({
        success: true,
        message: 'Kitap başarıyla ödünç alındı!',
        borrowing,
        availableStock: book.stock - book.borrowedCount, // Kalan stok bilgisini de ver
    });
});

// --- Kitap İade Etme Fonksiyonu (Kullanıcılar ve Adminler İçin) ---
export const returnBook = catchAsyncErrors(async (req, res, next) => {
    // İade edilecek ödünç alma kaydının ID'si
    const { borrowingId } = req.body;

    if (!borrowingId) {
        return next(new ErrorHandler('İade edilecek ödünç alma kaydının ID\'si zorunludur.', 400));
    }

    // Ödünç alma kaydını bul. Kullanıcının sadece kendi ödünç aldığı kitabı iade edebilmesi için `user` filtresi ekle.
    // Adminler için bu filtreyi kaldırabilir veya ayrı bir rota yapabilirsin.
    const borrowing = await Borrowing.findOne({
        _id: borrowingId,
        user: req.user.id, // Sadece kullanıcının kendi kayıtlarını iade etmesine izin ver
        status: 'borrowed' // Sadece 'borrowed' durumundaki kayıtlar iade edilebilir
    }).populate('book'); // Kitap bilgilerini de çek (stok güncellemesi ve ceza için)

    if (!borrowing) {
        return next(new ErrorHandler('Geçerli bir ödünç alma kaydı bulunamadı veya zaten iade edilmiş.', 404));
    }

    const book = borrowing.book;

    if (!book) { // Kitap veritabanından silinmiş olabilir
        return next(new ErrorHandler('İlgili kitap bulunamadı. Lütfen yöneticiyle iletişime geçin.', 404));
    }

    // Ödünç alma statüsünü 'returned' olarak güncelle
    borrowing.status = 'returned';
    borrowing.actualReturnDate = Date.now(); // Fiili iade tarihini kaydet

    // Geç iade durumu kontrolü ve ceza hesaplama (isteğe bağlı)
    if (borrowing.actualReturnDate > borrowing.returnDate) {
        // Geç iade durumu için ceza hesaplama mantığı buraya eklenebilir.
        // Örn: const daysOverdue = Math.ceil((borrowing.actualReturnDate - borrowing.returnDate) / (1000 * 60 * 60 * 24));
        // borrowing.fineAmount = daysOverdue * process.env.DAILY_FINE_AMOUNT;
        // borrowing.status = 'overdue' // Statüsü 'overdue' olarak da güncellenebilir
        borrowing.status = 'overdue'; // Veya 'returned' kalıp, sadece fineAmount eklenebilir.
        // Eğer 'overdue' yaparsan, frontend'de bunun ayrımını yapmalısın.
        // Genelde 'returned' bırakılıp ceza miktarı belirtilir.
    }

    await borrowing.save();

    // Kitabın ödünç sayısını azalt
    book.borrowedCount -= 1;
    await book.save({ validateBeforeSave: false }); // Validator'ü burada atla

    res.status(200).json({
        success: true,
        message: 'Kitap başarıyla iade edildi!',
        borrowing,
        availableStock: book.stock - book.borrowedCount,
    });
});

// --- Kullanıcının Ödünç Aldığı Kitapları Listeleme (Kullanıcılar İçin) ---
export const getMyBorrowedBooks = catchAsyncErrors(async (req, res, next) => {
    // `req.user.id` ile oturum açmış kullanıcının ID'sine göre filtrelenir.
    const borrowedBooks = await Borrowing.find({ user: req.user.id })
    .populate('book') // Kitap bilgilerini de getir
    .sort({ borrowDate: -1 }); // En yeni ödünç alınanlar en başta

    res.status(200).json({
        success: true,
        borrowedBooks,
        count: borrowedBooks.length,
    });
});

// --- Tüm Ödünç Alma Kayıtlarını Listeleme (Admin İçin) ---
export const getAllBorrowings = catchAsyncErrors(async (req, res, next) => {
    // Tüm ödünç alma kayıtlarını listele (sadece adminler erişmeli!)
    const borrowings = await Borrowing.find()
    .populate('book') // Kitap bilgilerini getir
    .populate('user', 'name email') // Kullanıcı adını ve e-postasını getir
    .sort({ borrowDate: -1 });

    res.status(200).json({
        success: true,
        borrowings,
        count: borrowings.length,
    });
});

// --- Geciken Kitapları Tespit Etme Fonksiyonu (Admin Yetkisi Gerekir) ---
export const getOverdueBooks = catchAsyncErrors(async (req, res, next) => {
    // Bugünün tarihini al
    const today = new Date();

    // Ödünç alma kayıtlarını sorgula:
    // 1. `status` 'borrowed' olmalı (henüz iade edilmemiş)
    // 2. `returnDate` bugünden küçük olmalı (yani teslim tarihi geçmiş)
    const overdueBorrowings = await Borrowing.find({
        status: 'borrowed',
        returnDate: { $lt: today } // $lt: "less than" (küçükse)
    })
    .populate('book') // Kitap bilgilerini getir
    .populate('user', 'name email') // Kullanıcı adını ve e-postasını getir
    .sort({ returnDate: 1 }); // En eski gecikenler en başta

    if (overdueBorrowings.length === 0) {
        return res.status(200).json({
            success: true,
            message: "Gecikmiş kitap bulunamadı.",
            overdueBooks: []
        });
    }

    res.status(200).json({
        success: true,
        message: "Gecikmiş kitaplar başarıyla listelendi.",
        overdueBooks: overdueBorrowings,
        count: overdueBorrowings.length,
    });
});

export const borrowBookAdmin = catchAsyncErrors(async (req, res, next) => {
    console.log("Request Body:", req.body);
    const { bookId, returnDate, userId } = req.body; // `returnDate` (teslim tarihi), istemciden gelmeli

    if (!bookId || !returnDate || !userId) {
        return next(new ErrorHandler('Bütün alanlar zorunludur', 400));
    }

    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book) {
        return next(new ErrorHandler('Ödünç alınacak kitap bulunamadı!', 404));
    }
    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı!', 404));
    }

    // Yeterli stok var mı kontrol et
    if (book.stock - book.borrowedCount <= 0) {
        return next(new ErrorHandler('Bu kitabın mevcut kopyası kalmadı. Lütfen daha sonra tekrar deneyin.', 400));
    }

    // `returnDate`'in geçerli bir tarih olduğundan ve geçmişte olmadığından emin ol
    const parsedReturnDate = new Date(returnDate);
    if (isNaN(parsedReturnDate.getTime())) { // Geçersiz tarih formatı
        return next(new ErrorHandler('Geçerli bir teslim tarihi formatı girin (örn: YYYY-MM-DD).', 400));
    }
    if (parsedReturnDate <= Date.now()) { // Teslim tarihi geçmişte veya şu an olamaz
        return next(new ErrorHandler('Teslim tarihi gelecekte olmalı.', 400));
    }

    // Kullanıcının bu kitabı zaten ödünç alıp almadığını kontrol et
    // (Aynı kitaptan birden fazla kopya ödünç almasına izin vermek istemiyorsanız)
    const existingBorrowing = await Borrowing.findOne({
        user: userId,
        book: bookId,
        status: 'borrowed' // Henüz iade edilmemiş
    });

    if (existingBorrowing) {
        return next(new ErrorHandler('Bu kitabı zaten ödünç almışsınız. Lütfen önce mevcut kopyayı iade edin.', 400));
    }

    // Yeni ödünç alma kaydını oluştur
    const borrowing = await Borrowing.create({
        book: bookId,
        user: userId,
        returnDate: parsedReturnDate,
        status: 'borrowed'
    });

    // Kitabın ödünç sayısını artır
    book.borrowedCount += 1;
    await book.save({ validateBeforeSave: false }); // `borrowedCount` validatörü burada devreye girmediği için false.
    // Eğer `book.stock`tan fazlasını ödünç almaya çalışırsan,
    // yukarıdaki `if (book.stock - book.borrowedCount <= 0)` kontrolü bunu yakalar.

    res.status(200).json({
        success: true,
        message: 'Kitap başarıyla ödünç alındı!',
        borrowing,
        availableStock: book.stock - book.borrowedCount, // Kalan stok bilgisini de ver
    });
});

export const returnBookAdmin = catchAsyncErrors(async (req, res, next) => {
    // İade edilecek ödünç alma kaydının ID'si
    const { borrowingId } = req.body;

    if (!borrowingId) {
        return next(new ErrorHandler('İade edilecek ödünç alma kaydının ID\'si zorunludur.', 400));
    }

    // Ödünç alma kaydını bul. Kullanıcının sadece kendi ödünç aldığı kitabı iade edebilmesi için `user` filtresi ekle.
    // Adminler için bu filtreyi kaldırabilir veya ayrı bir rota yapabilirsin.
    const borrowing = await Borrowing.findOne({
        _id: borrowingId,
        status: 'borrowed' // Sadece 'borrowed' durumundaki kayıtlar iade edilebilir
    }).populate('book'); // Kitap bilgilerini de çek (stok güncellemesi ve ceza için)

    if (!borrowing) {
        return next(new ErrorHandler('Geçerli bir ödünç alma kaydı bulunamadı veya zaten iade edilmiş.', 404));
    }

    const book = borrowing.book;

    if (!book) { // Kitap veritabanından silinmiş olabilir
        return next(new ErrorHandler('İlgili kitap bulunamadı. Lütfen yöneticiyle iletişime geçin.', 404));
    }

    // Ödünç alma statüsünü 'returned' olarak güncelle
    borrowing.status = 'returned';
    borrowing.actualReturnDate = Date.now(); // Fiili iade tarihini kaydet

    // Geç iade durumu kontrolü 
    if (borrowing.actualReturnDate > borrowing.returnDate) {
        borrowing.status = 'overdue'; 
    }

    await borrowing.save();

    // Kitabın ödünç sayısını azalt
    book.borrowedCount -= 1;
    await book.save({ validateBeforeSave: false }); // Validator'ü burada atla

    res.status(200).json({
        success: true,
        message: 'Kitap başarıyla iade edildi!',
        borrowing,
        availableStock: book.stock - book.borrowedCount,
    });
});

export const deleteLeon = catchAsyncErrors(async (req, res, next) => {
    const borrowing = await Borrowing.findById(req.params.id);

    if (!borrowing) {
        return next(new ErrorHandler('Silinecek ödünç işlemi bulunamadı', 404));
    }

    await borrowing.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Ödünç işlemi başarıyla silindi!',
    });
});