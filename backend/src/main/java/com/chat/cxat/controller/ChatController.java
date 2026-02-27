package com.chat.cxat.controller;

import com.chat.cxat.model.ChatRoom;
import com.chat.cxat.model.Message;
import com.chat.cxat.service.ChatService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/room")
    public ChatRoom createRoom() {
        return chatService.createPrivateRoom();
    }

    @PostMapping("/send")
    public Message sendMessage(@RequestBody Message message) {
        return chatService.sendMessage(message);
    }

    @GetMapping("/messages/{roomId}")
    public List<Message> getMessages(@PathVariable String roomId) {
        return chatService.getMessages(roomId);
    }
    @GetMapping("/room/{roomId}/exists")
public boolean roomExists(@PathVariable String roomId) {
    return chatService.roomExists(roomId);
}
}