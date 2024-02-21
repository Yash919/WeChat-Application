var stompClient=null

function connect(){

    let socket=new SockJS("/server1")

    stompClient=Stomp.over(socket)

    stompClient.connect({},function(frame){

            console.log("Connected: "+ frame)

            $("#name-from").addClass('d-none')

            $("#chat-room").removeClass('d-none')

            //subscribe
            stompClient.subscribe("/topic/return-to",function(response){
                showMessage(JSON.parse(response.body))
            })

            // Subscribe to receive active session count updates
            stompClient.subscribe("/topic/session-count", function(count) {
                $("#active-sessions").text(count.body);
            });

            // subscribe for deleting the message
            stompClient.subscribe("/topic/delete-message", function(messageId) {
                        // Extract the messageId from the message body
                        var deletedMessageId = messageId.body;

                        // Find and remove the deleted message from the UI
                        $("#" + deletedMessageId).remove();
            });

            // subscribe for editing the message
            stompClient.subscribe("/topic/edit-message", function(editedMessage) {
                // Extract the edited message from the message body
                var editedMsg = JSON.parse(editedMessage.body);

                // It showing me this error that's why i have given time here
                // InvalidDefinitionException: Java 8 date/time type `java.time.LocalDateTime` not supported by default:
                var timestamp = new Date();
                var format = {hour: '2-digit',minute: '2-digit', hour12: true };
                var timeString = timestamp.toLocaleTimeString(undefined,format);

                // Update the message content in the UI
                $("#" + editedMsg.id + " td:first-child").html(`<b>${editedMsg.name} ${timeString} :</b> <span style="position: relative;">${editedMsg.content} <span class="edited-label" style="position: absolute; top: -10px; opacity: 0.5;"><b>Edited</b></span></span>`);

            });

            // Notify server about joining session
            stompClient.send("/app/session", {}, "join");

            // Periodically update active session count every 5 seconds
            //setInterval(updateActiveSessionCount, 5000);

    })

}

function updateActiveSessionCount() {
    // Send a request to server to get the updated active session count
    stompClient.send("/app/session-count", {}, "");
}

function showMessage(message){

        var timestamp = new Date();
        var format = {hour: '2-digit',minute: '2-digit', hour12: true };
        var timeString = timestamp.toLocaleTimeString(undefined,format);

        // Edit Button functionality
        var editButton=message.name === localStorage.getItem("name") ? `<button class="btn btn-primary btn-sm" onclick="editMessage('${message.id}')">Edit</button>` : '';

        // Delete Button functionality
        var deleteButton=message.name === localStorage.getItem("name") ? `<button class="btn btn-danger btn-sm" onclick="deleteMessage('${message.id}')">Delete</button>` : '';

        var messageHtml = `
                <tr id="${message.id}" style = "display:flex;gap:55px">
                    <td><b>${message.name} ${timeString} :</b> ${message.content}</td>
                    <td>${editButton} ${deleteButton}</td>
                </tr>
            `;

        $("#message-container-table").prepend(messageHtml)

}

function sendmessage(){

    var messageValue=$("#message-value").val().trim();

    if(messageValue===""){
            // can't change alert text size. (If it is necessary than create a fake alert box and than do size change)
            alert("Dumb🫵 you sending empty message 🤨👾")
            return;
    }

    let messageId=generateUniqueId();

    let jsonOb={
        id: messageId,
        name:localStorage.getItem("name"),
        content:$("#message-value").val()
    }

    stompClient.send("/app/message",{},JSON.stringify(jsonOb));

    // Clear the message field after sending
    $("#message-value").val("");
}

function deleteMessage(messageId){
    stompClient.send("/app/delete-message",{},messageId);
}


function editMessage(messageId) {
    var name=localStorage.getItem("name");
    var newContent = prompt("Enter the new message content:");
    if (newContent !== null && newContent.trim() !== "") {
        var editedMessage = {
            id: messageId,
            name: name,
            content: newContent.trim()
        };
        stompClient.send("/app/edit-message", {}, JSON.stringify(editedMessage));
    }
}

function generateUniqueId(){
    // combination of timestamp and random number
    return Date.now() + Math.random().toString(36).substring(2);
}


$(document).ready(e=>{

    // Onclick login via name
    $("#login").click(()=>{
        loginuser();
    })

    // Enter Button trigger for login via name
    $("#name-value").keypress((e)=>{
        if(e.which === 13){
            loginuser();
        }
    });

    // OnClick sending message
    $("#send").click(()=>{
        sendmessage();

    })

    // Enter Button trigger for sending message
    $("#message-value").keypress((e)=>{
        if(e.which === 13){
            sendmessage();
        }
    });

    function loginuser(){

            let name=$("#name-value").val().trim()
            if(name===""){
                // can't change alert text size. (If it is necessary than create a fake alert box and than do size change)
                alert("Name cannot be empty. 🤗🤗")
                return
            }
            localStorage.setItem("name",name)
            $("#name-title").html(`Welcome,<b> ${name}😗 </b>`)
            connect();
    }

    $("#logout").click(()=>{

        localStorage.removeItem("name")
        if(stompClient!=null){
            // Notify server about leaving session
            stompClient.send("/app/session", {}, "leave");

            stompClient.disconnect()
            $("#name-from").removeClass('d-none')
            $("#chat-room").addClass('d-none')

            // Clear the name which previously used
            $("#name-value").val("");


        }
    })


})