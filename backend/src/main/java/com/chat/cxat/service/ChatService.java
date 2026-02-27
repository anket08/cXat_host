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

    public ChatService(ChatRoomRepository chatRoomRepository,
                    MessageRepository messageRepository,
                    RedisService redisService) {

        this.chatRoomRepository = chatRoomRepository;
        this.messageRepository = messageRepository;
        this.redisService = redisService;
    }


    // ==========================
    // CREATE PRIVATE ROOM
    // ==========================

    public ChatRoom createPrivateRoom() {

        String roomId = generateUniqueRoomId();

        ChatRoom room = new ChatRoom();
        room.setId(roomId);
        room.setType("PRIVATE");

        return chatRoomRepository.save(room);
    }



    // ==========================
    // GENERATE UNIQUE ROOM ID
    // ==========================

    private String generateUniqueRoomId() {

        Random random = new Random();
        String roomId;

        do {

            int number = 1000 + random.nextInt(9000);
            roomId = String.valueOf(number);

        } while (chatRoomRepository.existsById(roomId));

        return roomId;
    }



    // ==========================
    // SEND MESSAGE
    // ==========================

    public Message sendMessage(Message message) {

        /*
        1️⃣ Save message in MongoDB
         */
        Message saved =
                messageRepository.save(message);


        /*
        2️⃣ Delete Redis Cache
        So next read fetches fresh messages
         */

        redisService.deleteChatCache(
                saved.getRoomId()
        );


        return saved;
    }



    // ==========================
    // MARK MESSAGES AS READ
    // ==========================

    public void markMessagesAsRead(String roomId) {

        /*
        1️⃣ Fetch messages from MongoDB
         */

        List<Message> messages =
                messageRepository
                        .findByRoomIdOrderByCreatedAtAsc(roomId);


        /*
        2️⃣ Update read status
         */

        for (Message m : messages) {
            m.setRead(true);
        }


        /*
        3️⃣ Save updated messages
         */

        messageRepository.saveAll(messages);


        /*
        4️⃣ Delete Redis Cache
        So read status updates reflect
         */

        redisService.deleteChatCache(roomId);
    }



    // ==========================
    // ROOM EXISTS
    // ==========================

    public boolean roomExists(String roomId) {

        return chatRoomRepository.existsById(roomId);
    }



    // ==========================
    // GET MESSAGES (CACHE ASIDE)
    // ==========================

    public List<Message> getMessages(String roomId) {

    List<Message> cachedMessages =
            redisService.getCachedMessages(roomId);

    if (cachedMessages != null) {

        System.out.println(" Redis HIT");

        return cachedMessages;
    }

    System.out.println("Mongo HIT");

    List<Message> messages =
        messageRepository
                .findByRoomIdOrderByCreatedAtAsc(roomId);

try {
    Thread.sleep(0);           // 3 sec delay sirf cache testing ke liye
} catch (Exception e) {}

    redisService.cacheMessages(roomId, messages);

    return messages;
}
}