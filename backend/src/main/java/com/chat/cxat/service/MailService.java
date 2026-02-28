package com.chat.cxat.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /*
     =========================
     SEND RESET OTP
     =========================
     */

    @Async
    public void sendResetCode(String email,String code){

        try{

            SimpleMailMessage mail =
                    new SimpleMailMessage();

            mail.setFrom("cxat.app@gmail.com");

            mail.setReplyTo("cxat.app@gmail.com");

            mail.setTo(email);

            mail.setSubject(
                    "CXAT Password Reset Code"
            );

            mail.setText(

                    "Your CXAT password reset code:\n\n"

                    + code +

                    "\n\nValid for 10 minutes.\n\n"

                    + "CXAT Team"

            );

            mailSender.send(mail);

            System.out.println(
                    "RESET MAIL SENT"
            );

        }

        catch(Exception e){

            System.out.println(
                    "RESET MAIL ERROR: "
                            + e.getMessage()
            );
        }

    }



    /*
     =========================
     SEND REGISTER OTP
     =========================
     */

    @Async
    public void sendRegisterOtp(
            String email,
            String code){

        try{

            SimpleMailMessage mail =
                    new SimpleMailMessage();

            mail.setFrom("cxat.app@gmail.com");

            mail.setReplyTo("cxat.app@gmail.com");

            mail.setTo(email);

            mail.setSubject(
                    "CXAT Email Verification OTP"
            );

            mail.setText(

                    "Your CXAT verification code:\n\n"

                    + code +

                    "\n\nValid for 10 minutes.\n\n"

                    + "CXAT Team"

            );

            mailSender.send(mail);

            System.out.println(
                    "REGISTER OTP SENT"
            );

        }

        catch(Exception e){

            System.out.println(
                    "REGISTER OTP ERROR: "
                            + e.getMessage()
            );
        }

    }



    /*
     =========================
     SEND WELCOME MAIL
     =========================
     */

    @Async
    public void sendWelcomeEmail(
            String email,
            String username,
            String userId){

        try{

            SimpleMailMessage mail =
                    new SimpleMailMessage();

            mail.setFrom("cxat.app@gmail.com");

            mail.setReplyTo("cxat.app@gmail.com");

            mail.setTo(email);

            mail.setSubject(
                    "Welcome to CXAT Chat"
            );

            mail.setText(

                    "Welcome to CXAT!\n\n"

                    + "Username: "
                    + username + "\n"

                    + "User ID: "
                    + userId + "\n\n"

                    + "Rules:\n"

                    + "1. No spam\n"
                    + "2. No abuse\n"
                    + "3. Respect users\n\n"

                    + "Enjoy chatting!\n\n"

                    + "CXAT Team"

            );

            mailSender.send(mail);

            System.out.println(
                    "WELCOME MAIL SENT"
            );

        }

        catch(Exception e){

            System.out.println(
                    "WELCOME MAIL ERROR: "
                            + e.getMessage()
            );
        }

    }

}