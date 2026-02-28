package com.chat.cxat.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendResetCode(
            String email,
            String code) {

        try {

            SimpleMailMessage mail = new SimpleMailMessage();

            mail.setFrom("cxat.app@gmail.com");

            mail.setTo(email);

            mail.setSubject(
                    "CXAT Password Reset");

            mail.setText(
                    "Your CXAT password reset code is:\n\n"
                            + code +
                            "\n\nThis code expires in 10 minutes.");

            mailSender.send(mail);

            System.out.println("MAIL SENT");

            return true;

        }

        catch (Exception e) {

            System.out.println(
                    "MAIL ERROR: "
                            + e.getMessage());

            return false;
        }

    }



    /*
     =============================
     SEND WELCOME EMAIL
     =============================
    */

    public boolean sendWelcomeEmail(
            String email,
            String username,
            String userId
    ) {

        try {

            SimpleMailMessage mail =
                    new SimpleMailMessage();

            mail.setFrom("cxat.app@gmail.com");

            mail.setTo(email);

            mail.setSubject(
                    "Welcome to CXAT Chat App"
            );

            mail.setText(

                    "Welcome to CXAT!\n\n"

                    + "Username: "
                    + username + "\n"

                    + "User ID: "
                    + userId + "\n\n"


                    + "Terms & Conditions:\n"

                    + "1. Do not spam\n"
                    + "2. No abuse\n"
                    + "3. Respect other users\n"
                    + "4. Data stored securely\n\n"


                    + "Enjoy chatting!\n\n"

                    + "CXAT Team"
            );

            mailSender.send(mail);

            System.out.println(
                    "Welcome Mail Sent"
            );

            return true;

        } catch (Exception e) {

            System.out.println(
                    "WELCOME MAIL ERROR: "
                    + e.getMessage()
            );

            return false;
        }
    }
    /*
 ============================
 SEND REGISTER OTP
 ============================
*/

public boolean sendRegisterOtp(
        String email,
        String code){

    try{

        SimpleMailMessage mail =
                new SimpleMailMessage();

        mail.setFrom("cxat.app@gmail.com");

        mail.setTo(email);

        mail.setSubject(
                "CXAT Email Verification OTP"
        );

        mail.setText(

                "Your CXAT Verification OTP:\n\n"

                + code +

                "\n\nValid for 10 minutes."

        );

        mailSender.send(mail);

        System.out.println("Register OTP Sent");

        return true;

    }catch(Exception e){

        System.out.println(
                "OTP MAIL ERROR: "
                + e.getMessage()
        );

        return false;
    }
}
}