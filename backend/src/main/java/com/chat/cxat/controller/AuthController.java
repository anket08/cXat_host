package com.chat.cxat.controller;

import com.chat.cxat.model.User;
import com.chat.cxat.service.UserService;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }


    /*
     =========================
     HEALTH CHECK
     =========================
    */

    @GetMapping("/health")
    public String health() {
        return "OK";
    }



    /*
     =========================
     SEND REGISTER OTP
     Popup Version
     =========================
    */

    @PostMapping("/send-otp")
    public Map<String,String> sendRegisterOtp(
            @RequestParam String email){

        String code =
                userService.sendRegisterOtp(email);

        return Map.of(
                "otp",code
        );
    }



    /*
     =========================
     VERIFY REGISTER OTP
     =========================
    */

    @PostMapping("/verify-otp")
    public String verifyRegisterOtp(

            @RequestParam String email,

            @RequestParam String code){

        return userService
                .verifyRegisterOtp(
                        email,
                        code);
    }



    /*
     =========================
     REGISTER USER
     =========================
    */

    @PostMapping("/register")
    public User register(
            @RequestBody User user){

        return userService.register(user);
    }



    /*
     =========================
     LOGIN USER
     =========================
    */

    @PostMapping("/login")
    public User login(
            @RequestBody User user){

        return userService.login(user);
    }



    /*
     =========================
     SEND RESET OTP
     Popup Version
     =========================
    */

    @PostMapping("/forgot")
    public Map<String,String> forgotPassword(
            @RequestParam String email){

        String code =
                userService.sendResetCode(email);

        return Map.of(
                "otp",code
        );
    }



    /*
     =========================
     VERIFY RESET OTP
     =========================
    */

    @PostMapping("/verify")
    public String verifyCode(

            @RequestParam String email,

            @RequestParam String code){

        return userService.verifyCode(
                email,
                code);
    }



    /*
     =========================
     RESET PASSWORD
     =========================
    */

    @PostMapping("/reset")
    public String resetPassword(

            @RequestParam String email,

            @RequestParam String code,

            @RequestParam String password){

        return userService.resetPassword(
                email,
                code,
                password);
    }

}