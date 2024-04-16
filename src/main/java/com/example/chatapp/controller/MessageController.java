package com.example.chatapp.controller;

import com.example.chatapp.entity.DownloadEvent;
import com.example.chatapp.entity.Message;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@RestController
public class MessageController {

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;
    private int activeSessions = -1;
    private List<Message> messages = new ArrayList<>();

    @MessageMapping("/message")
    @SendTo("/topic/return-to")
    public Message getContent(@RequestBody Message message){
        /*
        try{
            Thread.sleep(2000);
        }catch (InterruptedException e){
            e.printStackTrace();
        }
        */
        message.setTimestamp(LocalDateTime.now());
        // forming a list
        messages.add(message);
        return message;
    }

    @MessageMapping("/session")
    public void handleSessionCount(String message) {
        if (message.equals("join")) {
            activeSessions++;
        } else if (message.equals("leave")) {
            activeSessions--;
        }
        sendSessionCount();
    }

    private void sendSessionCount() {
        messagingTemplate.convertAndSend("/topic/session-count", activeSessions);
    }

    @MessageMapping("/delete-message")
    public void deleteMessage(String messageId) {
        // Find the message with the given messageId and remove it from the list of messages
        Iterator<Message> iterator = messages.iterator();
        while (iterator.hasNext()) {
            System.out.println("Received delete request for messageId: " + messageId);
            Message message = iterator.next();
            if (message.getId().equals(messageId)) {
                iterator.remove();
                System.out.println("Deleted message with id: " + messageId);
                break;
            }
        }
        // Broadcast the deletion to all clients
        messagingTemplate.convertAndSend("/topic/delete-message", messageId);
    }

    @MessageMapping("/edit-message")
    public void editMessage(String messageJson) {
        // Parse the JSON to get the edited message data
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            Message editedMessage = objectMapper.readValue(messageJson, Message.class);
            // Find the message in the list and update its content
            for (Message message : messages) {
                if (message.getId().equals(editedMessage.getId())) {
                    message.setContent(editedMessage.getContent());
                    // Broadcast the edited message to all clients
                    messagingTemplate.convertAndSend("/topic/edit-message", editedMessage);
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @MessageMapping("/download")
    public void downloadChat(String username){
        // Download Event Message
        DownloadEvent downloadEvent = new DownloadEvent(username);

        // Broadcast the download event to all clients
        messagingTemplate.convertAndSend("/topic/download-event",downloadEvent);
    }
}

