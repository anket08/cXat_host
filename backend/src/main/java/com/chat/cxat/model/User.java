package com.chat.cxat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Document(collection = "users")
public class User {

    @Id
    private String id;


    /*
     =========================
     BASIC INFO
     =========================
     */

    private String username;

    private String email;

    private String password;

    private String status = "OFFLINE";



    /*
     =========================
     TIMESTAMP
     =========================
     */

    private String createdAt =
            LocalDateTime
            .now(ZoneOffset.UTC)
            .toString();



    /*
     =========================
     RESET PASSWORD OTP
     =========================
     */

    private String resetCode;

    private String resetCodeExpiry;



    /*
     =========================
     REGISTER OTP
     =========================
     */

    private String registerOtp;

    private String registerOtpExpiry;



    /*
     =========================
     CONSTRUCTOR
     =========================
     */

    public User(){}



    /*
     =========================
     GETTERS
     =========================
     */

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getResetCode() {
        return resetCode;
    }

    public String getResetCodeExpiry() {
        return resetCodeExpiry;
    }

    public String getRegisterOtp() {
        return registerOtp;
    }

    public String getRegisterOtpExpiry() {
        return registerOtpExpiry;
    }



    /*
     =========================
     SETTERS
     =========================
     */

    public void setId(String id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public void setResetCode(String resetCode) {
        this.resetCode = resetCode;
    }

    public void setResetCodeExpiry(String resetCodeExpiry) {
        this.resetCodeExpiry = resetCodeExpiry;
    }

    public void setRegisterOtp(String registerOtp) {
        this.registerOtp = registerOtp;
    }

    public void setRegisterOtpExpiry(String registerOtpExpiry) {
        this.registerOtpExpiry = registerOtpExpiry;
    }

}