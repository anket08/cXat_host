package com.chat.cxat.service;

import com.chat.cxat.model.Message;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisService(RedisTemplate<String,Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // ==========================
    // 1️⃣ ONLINE USERS
    // TTL = 5 minutes
    // ==========================

    public void setUserOnline(String username){

        String key = "online:" + username;

        redisTemplate.opsForValue().set(
                key,
                "true",
                300,
                TimeUnit.SECONDS
        );
    }

    public void setUserOffline(String username){

        redisTemplate.delete(
                "online:" + username
        );
    }

    public boolean isUserOnline(String username){

        Boolean exists = redisTemplate.hasKey(
                "online:" + username
        );

        return exists != null && exists;
    }



    // ==========================
    // 2️⃣ CHAT CACHE
    // TTL = 1 hour
    // ==========================
// Store messages (TTL 1 hour)
public void cacheMessages(
        String roomId,
        List<Message> messages){

    redisTemplate.opsForValue().set(
            "chat:" + roomId,
            messages,
            3600,
            TimeUnit.SECONDS
    );
}


// Get cached messages
public List<Message> getCachedMessages(String roomId){

    return (List<Message>)
            redisTemplate.opsForValue()
                    .get("chat:" + roomId);
}


// Delete cache
public void deleteChatCache(String roomId){

    redisTemplate.delete(
            "chat:" + roomId
    );
}

}