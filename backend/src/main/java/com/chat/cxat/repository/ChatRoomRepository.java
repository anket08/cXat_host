package com.chat.cxat.repository;

import com.chat.cxat.model.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {
    boolean existsById(String id);

}