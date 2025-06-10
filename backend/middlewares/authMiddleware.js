import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddlewares.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    // 1. Çerezden Tokenı Al
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("Bu kaynağa erişmek için lütfen giriş yapın!", 401)); // 401 Unauthorized
    }
    // 2. Tokenı Doğrula (Verify)
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // 3. Kullanıcıyı Bul ve req.user'a Ekle
    req.user = await User.findById(decodedData.id);
    // 4. Sonraki Middleware'e veya Rota İşleyiciye Geç
    next();
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
