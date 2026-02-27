package com.chat.cxat.service;

import com.chat.cxat.model.User;
import com.chat.cxat.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    // BCrypt encoder
    private final PasswordEncoder passwordEncoder;

    // Constructor Injection
    public UserService(UserRepository userRepository,
                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =========================
    // REGISTER USER
    // =========================
    public User register(User user) {

        // Hash password before saving
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        return userRepository.save(user);
    }


    // =========================
    // LOGIN USER
    // =========================
    public User login(User user) {

        // Find user in database
        User existing = userRepository.findByUsername(user.getUsername())
                .orElse(null);

        // If user not found
        if(existing == null){
            return null;
        }

        /*
        Compare plain password with hashed password
        BCrypt handles hashing internally
         */
        boolean isMatch = passwordEncoder.matches(
                user.getPassword(),
                existing.getPassword()
        );

        if(isMatch){
            return existing;
        }

        return null;
    }


    // =========================
    // FIND USER BY USERNAME
    // =========================
    public User findByUsername(String username) {

        return userRepository.findByUsername(username)
                .orElse(null);
    }

    
}