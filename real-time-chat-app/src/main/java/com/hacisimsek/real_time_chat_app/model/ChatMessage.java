package com.hacisimsek.real_time_chat_app.model;

import lombok.Data;

@Data
public class ChatMessage {
    private String sender;
    private String content;
    private MessageType type;

    public enum MessageType {
        CHAT, JOIN, LEAVE
    }
}