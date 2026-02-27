package com.chat.cxat.repository;

import com.chat.cxat.model.Message;

// import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByRoomIdOrderByCreatedAtAsc(String roomId);
}


// MongoDB me `id` field String type ka hota hai kyunki yeh ObjectId hota hai.
