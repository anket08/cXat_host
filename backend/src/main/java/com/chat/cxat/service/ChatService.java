package com.chat.cxat.service;

import com.chat.cxat.model.ChatRoom;
import com.chat.cxat.model.Message;
import com.chat.cxat.repository.ChatRoomRepository;
import com.chat.cxat.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final RedisService redisService;

    public ChatService(
            ChatRoomRepository chatRoomRepository,
            MessageRepository messageRepository,
            RedisService redisService) {

        this.chatRoomRepository =
                chatRoomRepository;

        this.messageRepository =
                messageRepository;

        this.redisService =
                redisService;
    }



    // ==========================
    // CREATE ROOM
    // ==========================

    public ChatRoom createPrivateRoom() {

        String roomId =
                generateUniqueRoomId();

        ChatRoom room =
                new ChatRoom();

        room.setId(roomId);
        room.setType("PRIVATE");

        return chatRoomRepository.save(room);
    }



    private String generateUniqueRoomId() {

        Random random =
                new Random();

        String roomId;

        do {

            int number =
                    1000 +
                    random.nextInt(9000);

            roomId =
                    String.valueOf(number);

        }

        while (chatRoomRepository.existsById(roomId));

        return roomId;
    }



    // ==========================
    // SEND MESSAGE
    // ==========================

    public Message sendMessage(Message message) {

        Message saved =
                messageRepository.save(message);


        // Cache invalidate

        redisService.deleteChatCache(
                saved.getRoomId());


        return saved;
    }



    // ==========================
    // MARK READ
    // ==========================

    public void markMessagesAsRead(
            String roomId) {

        List<Message> messages =
                messageRepository
                        .findByRoomIdOrderByCreatedAtAsc(
                                roomId);


        for(Message m : messages){

            m.setRead(true);

        }


        messageRepository.saveAll(messages);


        redisService.deleteChatCache(
                roomId);

    }



    // ==========================
    // ROOM EXISTS
    // ==========================

    public boolean roomExists(
            String roomId){

        return chatRoomRepository.existsById(roomId);


    }

//     recent chats for a user

    public List<Message> getRecentChats(String userId){

    return messageRepository.findRecentMessages(userId);

}



    // ==========================
    // GET MESSAGES (CACHE ASIDE)
    // ==========================

    public List<Message> getMessages(
            String roomId) {


        List<Message> cached =
                redisService.getCachedMessages(roomId);


        if(cached != null){

            return cached;

        }


        System.out.println("Mongo HIT");


        List<Message> messages =
                messageRepository
                        .findByRoomIdOrderByCreatedAtAsc(
                                roomId);


        redisService.cacheMessages(
                roomId,
                messages);


        return messages;

    }

}