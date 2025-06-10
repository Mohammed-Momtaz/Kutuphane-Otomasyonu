export function generateVerificationOtpEmailTemplate (otpCode) {
    return `
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; color: #333333; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
                <div class="email-container" style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e0e6ed;">
                    <div class="header" style="background-color: #6a9acb; padding: 30px; text-align: center; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Kütüphane Sistemi</h1>
                    </div>
                    <div class="content" style="padding: 30px; line-height: 1.6; text-align: center;">
                        <p style="margin-bottom: 15px; font-size: 16px;">Merhaba,</p>
                        <p style="margin-bottom: 15px; font-size: 16px;">Kütüphane sistemine giriş yapmak veya işleminizi tamamlamak için aşağıdaki <strong style="font-weight: bold;">Tek Kullanımlık Şifreyi (OTP)</strong> kullanın:</p>
                        <div class="otp-code" style="display: inline-block; background-color: #e0f2f7; color: #336699; font-size: 32px; font-weight: bold; padding: 15px 25px; margin: 25px 0; border-radius: 5px; letter-spacing: 3px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);">
                            ${otpCode}
                        </div>
                        <p style="margin-bottom: 15px; font-size: 16px;">Bu kod <strong style="font-weight: bold;">yalnızca 15 dakika</strong> geçerlidir.</p>
                        <p class="warning" style="font-size: 14px; color: #666666; margin-top: 25px;">Bu e-postayı siz talep etmediyseniz, lütfen dikkate almayın. Bu kodu asla kimseyle paylaşmayın.</p>
                    </div>
                    <div class="footer" style="background-color: #e6f2f9; padding: 20px; text-align: center; font-size: 13px; color: #666666; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 5px 0;">&copy; 2025 Kütüphane Yönetim Sistemi. Tüm hakları saklıdır.</p>
                        <p style="margin: 5px 0;">Herhangi bir sorunuz olursa, lütfen bizimle iletişime geçin.</p>
                        <p style="margin: 5px 0;"><a href="mailto:destek@kutuphane.com" style="color: #6a9acb; text-decoration: none;">destek@kutuphane.com</a></p>
                    </div>
                </div>
            </body>
            `
}