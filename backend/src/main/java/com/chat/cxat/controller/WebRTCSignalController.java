package com.chat.cxat.controller;

import com.chat.cxat.model.SignalMessage;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebRTCSignalController {

    private final SimpMessagingTemplate messagingTemplate;

    public WebRTCSignalController(
            SimpMessagingTemplate messagingTemplate) {

        this.messagingTemplate = messagingTemplate;
    }

    /*
     * =========================
     * WEBRTC SIGNALING
     * =========================
     */

    @MessageMapping("/signal")
    public void signal(SignalMessage signal) {

        /*
         * Forward signaling message
         * to all users in meeting room
         */

        messagingTemplate.convertAndSend(

                "/topic/signal/" +
                        signal.getMeetingCode(),

                signal

        );
    }
}