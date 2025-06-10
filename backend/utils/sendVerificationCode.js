import { generateVerificationOtpEmailTemplate } from "./emailTemplate.js";
import { sendEmail } from "./sendEmail.js";

export async function sendVerificationCode(verificationCode, email, res) {
    try {
        const message = generateVerificationOtpEmailTemplate(verificationCode);
        await sendEmail({
            email,
            subject: "Verification Code (MizoOoSh Library Management System)",
            message,
        });
        return { 
            success: true, 
            message: "Verification Send Successfully"
        };
    } catch (error) {
        console.error("Doğrulama kodu gönderme hatası:", error); // Hatayı logla
        return { 
            success: false, 
            message: "Failed To Send Verification Code"
        }; // Sonuç döndür
    }
}