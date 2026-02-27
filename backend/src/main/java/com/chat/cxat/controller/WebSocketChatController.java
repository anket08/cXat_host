package com.chat.cxat.controller;

import com.chat.cxat.model.Message;
import com.chat.cxat.model.ReadReceipt;
import com.chat.cxat.service.ChatService;
import com.chat.cxat.service.RedisService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketChatController {

        private final ChatService chatService;
        private final SimpMessagingTemplate messagingTemplate;
        private final RedisService redisService;

        public WebSocketChatController(
                        ChatService chatService,
                        SimpMessagingTemplate messagingTemplate,
                        RedisService redisService) {

                this.chatService = chatService;
                this.messagingTemplate = messagingTemplate;
                this.redisService = redisService;
        }
@MessageMapping("/read")
public void read(ReadReceipt receipt){

    // Update MongoDB
    chatService.markMessagesAsRead(
            receipt.getRoomId()
    );

    // Broadcast read status
    messagingTemplate.convertAndSend(
            "/topic/read/" +
            receipt.getRoomId(),
            receipt
    );
}
        @MessageMapping("/chat")
        public void send(Message message) {

                /*
                 * 1️⃣ Mark sender online in Redis
                 * TTL = 5 minutes
                 */
                redisService.setUserOnline(
                                message.getSenderId());

                /*
                 * 2️⃣ Save message in MongoDB
                 */
                Message savedMessage = chatService.sendMessage(message);

                /*
                 * 3️⃣ Send message to room
                 */
                messagingTemplate.convertAndSend(
                                "/topic/messages/" +
                                                savedMessage.getRoomId(),
                                savedMessage);
        }
}