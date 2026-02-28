package com.chat.cxat.service;

import okhttp3.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    /*
     =========================
     RESEND API KEY
     =========================
     */

    @Value("${resend.api.key}")
    private String apiKey;


    /*
     =========================
     SENDER
     =========================
     */

    private static final String FROM =
            "CXAT <onboarding@resend.dev>";


    private final OkHttpClient client =
            new OkHttpClient();



    /*
     =========================
     RESET OTP
     =========================
     */

    @Async
    public void sendResetCode(String email,String code){

        sendEmail(
                email,
                "CXAT Password Reset",
                "Your OTP: <b>"+code+"</b><br><br>Valid 10 minutes"
        );
    }



    /*
     =========================
     REGISTER OTP
     =========================
     */

    @Async
    public void sendRegisterOtp(String email,String code){

        sendEmail(
                email,
                "CXAT Verification",
                "Your OTP: <b>"+code+"</b><br><br>Valid 10 minutes"
        );
    }



    /*
     =========================
     WELCOME MAIL
     =========================
     */

    @Async
    public void sendWelcomeEmail(
            String email,
            String username,
            String userId){

        String html =

                "Welcome to CXAT!<br><br>"

                +"Username: "+username+"<br>"

                +"User ID: "+userId+"<br><br>"

                +"Enjoy chatting<br><br>"

                +"CXAT Team";


        sendEmail(email,"Welcome to CXAT",html);

    }



    /*
     =========================
     ADD CONTACT (FREE PLAN FIX)
     =========================
     */

    private void addContact(String email){

        try{

            String json = "{"
                    +"\"email\":\""+email+"\""
                    +"}";


            RequestBody body =
                    RequestBody.create(
                            json,
                            MediaType.get("application/json")
                    );


            Request request =
                    new Request.Builder()

                            .url("https://api.resend.com/contacts")

                            .post(body)

                            .addHeader(
                                    "Authorization",
                                    "Bearer "+apiKey.trim())

                            .addHeader(
                                    "Content-Type",
                                    "application/json")

                            .build();


            client.newCall(request).execute().close();

            System.out.println("CONTACT ADDED");

        }
        catch(Exception e){

            System.out.println(
                    "CONTACT ERROR: "
                            +e.getMessage());
        }

    }



    /*
     =========================
     CORE MAIL METHOD
     =========================
     */

    private void sendEmail(
            String email,
            String subject,
            String html){

        try{

            /*
             Add contact first
            */

            addContact(email);


            String json = "{"
                    +"\"from\":\""+FROM+"\","
                    +"\"to\":[\""+email+"\"],"
                    +"\"subject\":\""+subject+"\","
                    +"\"html\":\""+html+"\""
                    +"}";


            RequestBody body =
                    RequestBody.create(
                            json,
                            MediaType.get("application/json")
                    );


            Request request =
                    new Request.Builder()

                            .url("https://api.resend.com/emails")

                            .post(body)

                            .addHeader(
                                    "Authorization",
                                    "Bearer "+apiKey.trim())

                            .addHeader(
                                    "Content-Type",
                                    "application/json")

                            .build();


            Response response =
                    client.newCall(request)
                            .execute();


            System.out.println(
                    "MAIL STATUS = "
                            +response.code()
            );


            response.close();


        }
        catch(Exception e){

            System.out.println(
                    "MAIL ERROR = "
                            +e.getMessage());
        }

    }

}