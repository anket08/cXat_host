package com.chat.cxat.service;

import com.chat.cxat.model.User;
import com.chat.cxat.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class UserService {

    /*
     =========================
     DEPENDENCIES
     =========================
     */

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    /*
     =========================
     CONSTRUCTOR
     =========================
     */

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            MailService mailService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }


    /*
     =========================
     GENERATE OTP
     =========================
     */

    private String generateCode(){

        int code =
                100000 +
                new Random().nextInt(900000);

        return String.valueOf(code);
    }


    /*
     =========================
     REGISTER USER
     =========================
     */

    public User register(User user){

        // Gmail validation

        if(user.getEmail()==null ||
           !user.getEmail().endsWith("@gmail.com")){

            throw new RuntimeException(
                    "Only Gmail allowed"
            );
        }


        User existingEmail =
                userRepository
                .findByEmail(user.getEmail());


        if(existingEmail==null){

            throw new RuntimeException(
                    "Verify OTP first"
            );
        }


        // OTP verified check

        if(existingEmail.getRegisterOtp()==null){

            throw new RuntimeException(
                    "Verify OTP first"
            );
        }


        long expiry =
                Long.parseLong(
                existingEmail.getRegisterOtpExpiry()
        );


        if(System.currentTimeMillis()>expiry){

            throw new RuntimeException(
                    "OTP expired"
            );
        }


        // Username exists

        if(userRepository
                .findByUsername(
                        user.getUsername())
                .isPresent()){

            throw new RuntimeException(
                    "Username exists"
            );
        }



        /*
         Encrypt password
        */

        existingEmail.setUsername(
                user.getUsername());

        existingEmail.setPassword(

                passwordEncoder.encode(
                        user.getPassword()
        ));

        existingEmail.setStatus("OFFLINE");


        User saved =
                userRepository.save(
                        existingEmail);



        /*
         Welcome Email (Async)
        */

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

        User existing =
                userRepository
                .findByUsername(
                        user.getUsername())
                .orElse(null);

        if(existing==null)
            return null;


        boolean match =
                passwordEncoder.matches(
                        user.getPassword(),
                        existing.getPassword()
        );


        return match ? existing : null;
    }



    /*
     =========================
     FIND USER
     =========================
     */

    public User findByUsername(
            String username){

        return userRepository
                .findByUsername(username)
                .orElse(null);
    }



    /*
     =========================
     SEND RESET OTP
     =========================
     */

    public String sendResetCode(
            String email){

        User user =
                userRepository
                .findByEmail(email);

        if(user==null)
            return "User not found";


        String code =
                generateCode();


        user.setResetCode(code);


        user.setResetCodeExpiry(

                String.valueOf(

                System.currentTimeMillis()
                +600000

        ));


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

        User user =
                userRepository
                .findByEmail(email);

        if(user==null)
            return "User not found";


        if(user.getResetCode()==null)
            return "No reset request";


        if(!user.getResetCode().equals(code))
            return "Invalid code";


        long expiry =
                Long.parseLong(
                user.getResetCodeExpiry()
        );


        if(System.currentTimeMillis()>expiry)
            return "Code expired";


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
            String newPassword){

        User user =
                userRepository
                .findByEmail(email);

        if(user==null)
            return "User not found";


        if(user.getResetCode()==null)
            return "No reset request";


        if(!user.getResetCode().equals(code))
            return "Invalid code";


        long expiry =
                Long.parseLong(
                user.getResetCodeExpiry()
        );


        if(System.currentTimeMillis()>expiry)
            return "Code expired";


        user.setPassword(

                passwordEncoder.encode(
                        newPassword
        ));


        user.setResetCode(null);
        user.setResetCodeExpiry(null);


        userRepository.save(user);


        return "Password updated";
    }



    /*
     =========================
     SEND REGISTER OTP
     =========================
     */

    public String sendRegisterOtp(
            String email){

        if(email==null ||
           !email.endsWith("@gmail.com")){

            return "Only Gmail allowed";
        }


        String code =
                generateCode();


        User user =
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

        ));


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

        User user =
                userRepository
                .findByEmail(email);

        if(user==null)
            return "User not found";


        if(user.getRegisterOtp()==null)
            return "OTP not requested";


        if(!user.getRegisterOtp().equals(code))
            return "Invalid OTP";


        long expiry =
                Long.parseLong(
                user.getRegisterOtpExpiry()
        );


        if(System.currentTimeMillis()>expiry)
            return "OTP expired";


        return "Verified";
    }

}