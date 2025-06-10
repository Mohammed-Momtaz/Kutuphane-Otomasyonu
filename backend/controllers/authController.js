import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler, { errorMiddleware } from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";

//Register Fonksiyonu
export const register = catchAsyncErrors(async(req, res, next) => {
    try {
        const { name, email, password} = req.body;
        if(!name || !email || !password) {
            return next(new ErrorHandler("Lütfün Gerekli Alanları Doldorunuz", 400));
        }
        const emailRegex = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        if (!emailRegex.test(email)) {
            return next(new ErrorHandler("Lütfen Mail adresinizi doğru şekilde giriniz", 400));
        }
        const isRegisterd = await User.findOne({email, accountVerified: true});
        if (isRegisterd) {
            return next(new ErrorHandler("Bu Kullanıcı zaten sistemimizde kayıtlı", 400));
        }
        const registerationAttemptsByUser = await User.find({email, accountVerified: false });
        if (registerationAttemptsByUser.length >= 5) {
            return next(new ErrorHandler("Kayıt Denemlerini Aştın, lütfen destekle iletişime geçiniz.", 400));
        }
        if (password.length < 8 || password.length > 16 ) {
            return next(new ErrorHandler("Şifrenizin uzunluğu 8 ile 16 arasında olmalı"));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({name, email, password: hashedPassword});
        const verificationCode = await user.generateVerificationCode();
        await user.save();
        const emailResult = await sendVerificationCode(verificationCode, email);
            
        if (emailResult.success) {
            res.status(200).json({
                success: true,
                message: "Kayıt başarılı ve doğrulama kodu gönderildi!",
            });
        } else {
            await User.findByIdAndDelete(user._id);
            return next(new ErrorHandler("Kayıt başarılı ancak doğrulama kodu gönderilemedi. Lütfen daha sonra tekrar deneyin veya destekle iletişime geçin.", 500));
        }
    } catch (error) {
        next(error);
    };
});

//Otp Kontrol Fonksiyonu
export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return next(new ErrorHandler("Lütfen e-posta ve doğrulama kodunu girin.", 400));
        }
        // E-posta formatı kontrolü
        const emailRegex = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        if (!emailRegex.test(email)) {
            return next(new ErrorHandler("Lütfen geçerli bir e-posta adresi girin.", 400));
        }
        // Kullanıcıyı e-posta ve doğrulama kodu ile bul
        const user = await User.findOne({
            email,
            verificationCode: otp,
            accountVerified: false // Henüz doğrulanmamış hesapları arıyoruz
        });
        if (!user) {
            // Kullanıcı bulunamadıysa veya kod yanlışsa
            // Şüpheli denemeleri kaydetmek veya saymak isteyebilirsin
            return next(new ErrorHandler("Geçersiz doğrulama kodu veya e-posta. Lütfen kontrol edin.", 400));
        }
        // Kodun geçerlilik süresini kontrol et
        // Örneğin, kod 15 dakika içinde geçerli olmalıydı
        const now = new Date();
        const codeCreationTime = user.verificationCodeExpire;
        if (!codeCreationTime || now > codeCreationTime) {
            // Kodun süresi dolmuşsa, kullanıcıyı silebilir veya yeni kod göndermesini isteyebiliriz
            await User.deleteOne({ _id: user._id }); // Süresi dolmuş kodlu kullanıcıyı sil
            return next(new ErrorHandler("Doğrulama kodunun süresi doldu. Lütfen yeniden kayıt olun veya yeni kod isteyin.", 400));
        }
        // Hesap doğrulama başarılı!
        user.accountVerified = true; // Hesabı doğrulanmış olarak işaretle
        // user.verificationCode = null; // Doğrulama kodunu temizle
        // user.verificationCodeExpire = null; // Süre bitimi bilgisini temizle
        await user.save();

        sendToken(user, 200, res, "Hesabınız başarıyla doğrulandı ve aktif edildi");

    } catch (error) {
        return next(new ErrorHandler(`Hata Oluştu ${error}`,500));
    };
});

//Login Fonksiyonu
export const login = catchAsyncErrors(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 1. Girdi Kontrolü
        if (!email || !password) {
            return next(new ErrorHandler("Lütfen e-posta ve şifrenizi girin.", 400));
        }
        const emailRegex = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        if (!emailRegex.test(email)) {
            return next(new ErrorHandler("Lütfen geçerli bir e-posta adresi girin.", 400));
        }
        // 2. Kullanıcıyı Bulma (Şifre ile birlikte çekmeliyiz!)
        // select('+password') kullanmak, userModel'de şifreyi select: false yaptığımız için gereklidir.
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new ErrorHandler("Geçersiz e-posta veya şifre.", 400));
        }
        // 3. Hesabın Doğrulanıp Doğrulanmadığını Kontrol Etme
        if (!user.accountVerified) {
            // İstersen burada tekrar bir doğrulama kodu gönderme seçeneği sunabilirsin
            return next(new ErrorHandler("Hesabınız doğrulanmamış. Lütfen e-postanıza gönderilen doğrulama kodunu kullanın.", 403)); // 403 Forbidden
        }
        // 4. Şifreyi Karşılaştırma
        // bcrypt.compare() async bir fonksiyondur.
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler("Geçersiz e-posta veya şifre.", 400));
        }
        // 5. Başarılı Giriş Durumunda Token Gönderme
        sendToken(user, 200, res, "Giriş Başarılı!");
    } catch (error) {
        return next(new ErrorHandler(`Hata Oluştu ${error}`, 500));
    };
});

//Logout Fonksiyonu
export const logout = catchAsyncErrors(async (req, res, next) => {
    try {
        res.status(200).cookie("token", "", {
            expires: new Date(Date.now()),
            httpOnly: true,
        }).json({
            success: true,
            message: "Başarıyla çıkış yapıldı.",
        })
    } catch (error) {
        return next(new ErrorHandler(`Hata Oluştu ${error}`, 500));
    };
});

//getUser Fonksiyonu
export const getUser = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});