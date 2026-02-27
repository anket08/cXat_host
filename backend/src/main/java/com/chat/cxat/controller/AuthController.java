package com.chat.cxat.controller;

import com.chat.cxat.model.User;
import com.chat.cxat.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
// @CrossOrigin("*")   // allow frontend calls
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // REGISTER
    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.register(user);
    }

    // LOGIN
    @PostMapping("/login")
public User login(@RequestBody User user) {
    return userService.login(user);
}
}