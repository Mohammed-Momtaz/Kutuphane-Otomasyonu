import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddlewares.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Token'ı Authorization başlığından al
            token = req.headers.authorization.split(' ')[1];

            // Token'ı doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // JWT_SECRET'ınızın doğru olduğundan emin olun

            // Token'daki kullanıcı ID'sini kullanarak kullanıcıyı bul
            req.user = await User.findById(decoded.id).select('-password'); // Şifresiz user objesini req.user'a ata

            if (!req.user) {
                return res.status(401).json({ message: 'Bu token\'a ait kullanıcı bulunamadı.' });
            }

            next(); // Sonraki middleware'e geç
        } catch (error) {
            console.error('Token doğrulama hatası:', error.message);
            return res.status(401).json({ message: 'Geçersiz token veya süresi dolmuş.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Bu rotaya erişmek için yetkilendirme token\'ı gerekli.' });
    }
});


export const authorizeRoles = (...roles) => { // 'admin', 'user' gibi rolleri parametre olarak alır
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            // Kullanıcının rolü yetkili roller arasında değilse hata döndür
            return next(new ErrorHandler(`Rolünüz (${req.user.role}) bu kaynağa erişim yetkisine sahip değil.`, 403 ));
        }
        next(); // Yetkili ise devam et
    };
};