package com.example.chatapp.entity;

public class DownloadEvent {
    private String username;

    public DownloadEvent(){

    }
    public DownloadEvent(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
