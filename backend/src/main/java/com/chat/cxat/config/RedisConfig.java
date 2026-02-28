package com.chat.cxat.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory factory) {

        RedisTemplate<String, Object> template =
                new RedisTemplate<>();

        template.setConnectionFactory(factory);

        // Key serializer
        template.setKeySerializer(
                new StringRedisSerializer());

        // Value serializer
        template.setValueSerializer(
                new GenericJackson2JsonRedisSerializer());

        // Hash key serializer
        template.setHashKeySerializer(
                new StringRedisSerializer());

        // Hash value serializer
        template.setHashValueSerializer(
                new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();

        return template;
    }
}