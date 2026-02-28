package com.chat.cxat;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableCaching
@EnableAsync
@SpringBootApplication
public class CxatApplication {

    public static void main(String[] args) {
        SpringApplication.run(CxatApplication.class, args);
    }
}