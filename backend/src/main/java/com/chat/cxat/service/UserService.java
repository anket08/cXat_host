package com.chat.cxat.service;

import com.chat.cxat.model.User;
import com.chat.cxat.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;



    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            MailService mailService){

        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;
        this.mailService=mailService;
    }



    /*
     =========================
     GENERATE OTP
     =========================
     */

    private String generateCode(){

        return String.valueOf(
                100000+
                new Random().nextInt(900000)
        );

    }



    /*
     =========================
     REGISTER USER
     =========================
     */

    public User register(User user){

        if(user.getEmail()==null ||
           !user.getEmail().endsWith("@gmail.com"))
            throw new RuntimeException("Only Gmail allowed");


        User temp=
                userRepository.findByEmail(
                        user.getEmail()
                );


        if(temp==null ||
           temp.getRegisterOtp()==null)
            throw new RuntimeException("Verify OTP first");


        long expiry=
                Long.parseLong(
                        temp.getRegisterOtpExpiry()
                );


        if(System.currentTimeMillis()>expiry)
            throw new RuntimeException("OTP expired");


        if(userRepository.findByUsername(
                user.getUsername())
                .isPresent())
            throw new RuntimeException("Username exists");



        temp.setUsername(
                user.getUsername()
        );


        temp.setPassword(
                passwordEncoder.encode(
                        user.getPassword()
                )
        );


        temp.setStatus("OFFLINE");


        User saved=
                userRepository.save(temp);



        mailService.sendWelcomeEmail(
                saved.getEmail(),
                saved.getUsername(),
                saved.getId()
        );


        return saved;

    }



    /*
     =========================
     LOGIN
     =========================
     */

    public User login(User user){

        User existing=
                userRepository
                        .findByUsername(
                                user.getUsername()
                        )
                        .orElse(null);


        if(existing==null)
            return null;


        boolean match=
                passwordEncoder.matches(
                        user.getPassword(),
                        existing.getPassword()
                );


        return match?existing:null;

    }



    /*
     =========================
     SEND RESET OTP
     =========================
     */

    public String sendResetCode(
            String email){

        User user=
                userRepository
                        .findByEmail(email);


        if(user==null)
            return "User not found";


        String code=
                generateCode();


        user.setResetCode(code);


        user.setResetCodeExpiry(

                String.valueOf(

                        System.currentTimeMillis()
                                +600000
                )
        );


        userRepository.save(user);


        mailService.sendResetCode(
                email,
                code
        );


        return "Reset code sent";
    }



    /*
     =========================
     VERIFY RESET OTP
     =========================
     */

    public String verifyCode(
            String email,
            String code){

        User user=
                userRepository
                        .findByEmail(email);


        if(user==null)
            return "User not found";


        if(user.getResetCode()==null)
            return "No reset request";


        if(!user.getResetCode().equals(code))
            return "Invalid code";


        long expiry=
                Long.parseLong(
                        user.getResetCodeExpiry()
                );


        if(System.currentTimeMillis()>expiry)
            return "Expired";


        return "Verified";
    }



    /*
     =========================
     RESET PASSWORD
     =========================
     */

    public String resetPassword(
            String email,
            String code,
            String password){

        User user=
                userRepository
                        .findByEmail(email);


        if(user==null)
            return "User not found";


        if(!code.equals(
                user.getResetCode()))
            return "Invalid code";


        long expiry=
                Long.parseLong(
                        user.getResetCodeExpiry()
                );


        if(System.currentTimeMillis()>expiry)
            return "Expired";


        user.setPassword(
                passwordEncoder.encode(
                        password
                )
        );


        user.setResetCode(null);
        user.setResetCodeExpiry(null);


        userRepository.save(user);


        return "Password updated";

    }



    /*
     =========================
     REGISTER OTP
     =========================
     */

    public String sendRegisterOtp(
            String email){

        if(email==null ||
           !email.endsWith("@gmail.com"))
            return "Only Gmail allowed";


        String code=
                generateCode();


        User user=
                userRepository
                        .findByEmail(email);


        if(user==null){

            user=new User();

            user.setEmail(email);

        }


        user.setRegisterOtp(code);


        user.setRegisterOtpExpiry(

                String.valueOf(

                        System.currentTimeMillis()
                                +600000
                )
        );


        userRepository.save(user);


        mailService.sendRegisterOtp(
                email,
                code
        );


        return "OTP Sent";
    }



    /*
     =========================
     VERIFY REGISTER OTP
     =========================
     */

    public String verifyRegisterOtp(
            String email,
            String code){

        User user=
                userRepository
                        .findByEmail(email);


        if(user==null)
            return "User not found";


        if(!code.equals(
                user.getRegisterOtp()))
            return "Invalid OTP";


        long expiry=
                Long.parseLong(
                        user.getRegisterOtpExpiry()
                );


        if(System.currentTimeMillis()>expiry)
            return "Expired";


        return "Verified";

    }

}