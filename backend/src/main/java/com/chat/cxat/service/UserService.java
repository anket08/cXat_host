package com.chat.cxat.service;

import com.chat.cxat.model.User;
import com.chat.cxat.repository.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class UserService {

        /*
         * ==============================
         * DEPENDENCIES
         * ==============================
         */

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final MailService mailService;

        /*
         * ==============================
         * CONSTRUCTOR INJECTION
         * ==============================
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
         * ==============================
         * REGISTER USER
         * ==============================
         */
public User register(User user) {

    /*
     Gmail validation
    */

    if(!user.getEmail()
            .endsWith("@gmail.com")){

        throw new RuntimeException(
                "Only Gmail allowed"
        );
    }


    /*
     Duplicate Email Check
    */

    User emailUser =
            userRepository
            .findByEmail(user.getEmail());

    if(emailUser != null &&
       emailUser.getUsername()!=null){

        throw new RuntimeException(
                "Email already registered"
        );
    }



    /*
     Username Exists Check
    */

    if(userRepository
            .findByUsername(
                    user.getUsername())
            .isPresent()){

        throw new RuntimeException(
                "Username exists"
        );
    }



    /*
     OTP Verified Check
    */

    User tempUser =
            userRepository
            .findByEmail(user.getEmail());

    if(tempUser==null ||
       tempUser.getRegisterOtp()==null){

        throw new RuntimeException(
                "Verify OTP first"
        );
    }



    /*
     Encrypt Password
    */

    user.setPassword(

            passwordEncoder.encode(
                    user.getPassword()
    ));


    user.setStatus("OFFLINE");


    User saved =
            userRepository.save(user);



    /*
     Welcome Email
    */

    mailService.sendWelcomeEmail(

            saved.getEmail(),

            saved.getUsername(),

            saved.getId()

    );


    return saved;
}
        /*
         * ==============================
         * LOGIN USER
         * ==============================
         */

        public User login(User user) {

                User existing = userRepository
                                .findByUsername(user.getUsername())
                                .orElse(null);

                if (existing == null)
                        return null;

                boolean match = passwordEncoder.matches(
                                user.getPassword(),
                                existing.getPassword());

                return match ? existing : null;
        }

        /*
         * ==============================
         * FIND USER
         * ==============================
         */

        public User findByUsername(String username) {

                return userRepository
                                .findByUsername(username)
                                .orElse(null);
        }

        /*
         * ==============================
         * GENERATE OTP CODE
         * ==============================
         */

        private String generateCode() {

                int code = 100000 +
                                new Random().nextInt(900000);

                return String.valueOf(code);
        }

        /*
         * ==============================
         * SEND RESET CODE (FORGOT PASSWORD)
         * ==============================
         */

        public String sendResetCode(String email) {

                User user = userRepository.findByEmail(email);

                if (user == null)
                        return "User not found";

                /*
                 * Generate 6 digit OTP
                 */

                String code = generateCode();

                /*
                 * Expiry time = 10 minutes
                 */

                String expiry = String.valueOf(
                                System.currentTimeMillis()
                                                + 600000);

                /*
                 * Save OTP inside User
                 */

                user.setResetCode(code);
                user.setResetCodeExpiry(expiry);

                userRepository.save(user);

                /*
                 * Send Email
                 */

                mailService.sendResetCode(
                                email,
                                code);

                return "Reset code sent";
        }

        /*
         * ==============================
         * VERIFY OTP CODE
         * ==============================
         */

        public String verifyCode(
                        String email,
                        String code) {

                User user = userRepository.findByEmail(email);

                if (user == null)
                        return "User not found";

                if (user.getResetCode() == null)
                        return "No reset request";

                if (!user.getResetCode().equals(code))
                        return "Invalid code";

                long expiry = Long.parseLong(
                                user.getResetCodeExpiry());

                if (System.currentTimeMillis() > expiry)
                        return "Code expired";

                return "Code verified";
        }

        /*
         * ==============================
         * RESET PASSWORD
         * ==============================
         */

        public String resetPassword(
                        String email,
                        String code,
                        String newPassword) {

                User user = userRepository.findByEmail(email);

                if (user == null)
                        return "User not found";

                if (user.getResetCode() == null)
                        return "No reset request";

                if (!user.getResetCode().equals(code))
                        return "Invalid code";

                long expiry = Long.parseLong(
                                user.getResetCodeExpiry());

                if (System.currentTimeMillis() > expiry)
                        return "Code expired";

                /*
                 * Update Password
                 */

                user.setPassword(
                                passwordEncoder.encode(
                                                newPassword));

                /*
                 * Clear OTP
                 */

                user.setResetCode(null);
                user.setResetCodeExpiry(null);

                userRepository.save(user);

                return "Password updated successfully";
        }

        /*
 ============================
 SEND REGISTER OTP
 ============================
*/

public String sendRegisterOtp(String email){

    // Gmail validation

    if(email==null ||
       !email.endsWith("@gmail.com")){

        return "Only Gmail allowed";
    }


    // Generate OTP

    String code =
            String.valueOf(
            100000+
            new Random().nextInt(900000)
    );


    User user =
            userRepository.findByEmail(email);


    if(user==null){

        user = new User();

        user.setEmail(email);

    }


    user.setRegisterOtp(code);

    user.setRegisterOtpExpiry(

            String.valueOf(
            System.currentTimeMillis()+600000
    ));


    userRepository.save(user);


    mailService.sendRegisterOtp(
            email,
            code
    );


    return "OTP Sent";
}

/*
 ============================
 VERIFY REGISTER OTP
 ============================
*/

public String verifyRegisterOtp(
        String email,
        String code){

    User user =
            userRepository.findByEmail(email);

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