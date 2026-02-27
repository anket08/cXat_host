package com.chat.cxat;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableCaching
@SpringBootApplication
public class CxatApplication {

    public static void main(String[] args) {
        SpringApplication.run(CxatApplication.class, args);
    }
}