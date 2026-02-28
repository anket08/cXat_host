package com.chat.cxat.service;

import com.chat.cxat.model.Message;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // ==========================
    // ONLINE USERS CACHE
    // TTL = 5 min
    // ==========================

    public void setUserOnline(String username) {

        try {

            redisTemplate.opsForValue().set(
                    "online:" + username,
                    "true",
                    300,
                    TimeUnit.SECONDS
            );

        } catch (Exception e) {

            System.out.println("Redis SET online error: "
                    + e.getMessage());

        }
    }


    public void setUserOffline(String username) {

        try {

            redisTemplate.delete(
                    "online:" + username);

        } catch (Exception e) {

            System.out.println("Redis DELETE error: "
                    + e.getMessage());

        }
    }


    public boolean isUserOnline(String username) {

        try {

            Boolean exists =
                    redisTemplate.hasKey(
                            "online:" + username);

            return exists != null && exists;

        } catch (Exception e) {

            System.out.println("Redis HASKEY error: "
                    + e.getMessage());

            return false;
        }
    }



    // ==========================
    // CHAT CACHE
    // TTL = 1 hour
    // ==========================


    public void cacheMessages(
            String roomId,
            List<Message> messages) {

        try {

            redisTemplate.opsForValue().set(
                    "chat:" + roomId,
                    messages,
                    3600,
                    TimeUnit.SECONDS);

            System.out.println("Redis SET chat:" + roomId);

        } catch (Exception e) {

            System.out.println("Redis SET error: "
                    + e.getMessage());

        }

    }



    public List<Message> getCachedMessages(
            String roomId) {

        try {

            Object cached =
                    redisTemplate.opsForValue()
                            .get("chat:" + roomId);

            if (cached != null) {

                System.out.println("Redis HIT");

                return (List<Message>) cached;

            }

        } catch (Exception e) {

            System.out.println("Redis GET error: "
                    + e.getMessage());

        }

        return null;
    }



    public void deleteChatCache(
            String roomId) {

        try {

            redisTemplate.delete(
                    "chat:" + roomId);

            System.out.println("Redis DELETE chat:"
                    + roomId);

        } catch (Exception e) {

            System.out.println("Redis DELETE error: "
                    + e.getMessage());

        }

    }

}