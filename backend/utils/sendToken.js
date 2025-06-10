import jwt from "jsonwebtoken";

export const sendToken = (user, statusCode, res, message) => {
    const token = user.generateToken();
    // Çerez seçenekleri
    const options = {
        httpOnly: true,
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // Örn: 7 gün * 24 saat * 60 dakika * 60 saniye * 1000 ms
    };
    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        message,
        user,
        token,
    });
};