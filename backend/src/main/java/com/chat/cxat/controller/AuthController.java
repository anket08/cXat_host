package com.chat.cxat.controller;

import com.chat.cxat.model.User;
import com.chat.cxat.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    /*
     =========================
     HEALTH CHECK (Render)
     =========================
    */

    @GetMapping("/health")
    public String health() {
        return "OK";
    }



    /*
     =========================
     SEND OTP BEFORE REGISTER
     Only Gmail allowed
     =========================
    */

    @PostMapping("/send-otp")
    public String sendRegisterOtp(
            @RequestParam String email){

        return userService
                .sendRegisterOtp(email);
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
     OTP verified required
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
     FORGOT PASSWORD
     Send OTP
     =========================
    */

    @PostMapping("/forgot")
    public String forgotPassword(
            @RequestParam String email){

        return userService.sendResetCode(email);
    }



    /*
     =========================
     VERIFY FORGOT OTP
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