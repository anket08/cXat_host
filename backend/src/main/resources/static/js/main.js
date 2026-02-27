let stompClient = null;
let currentUser = null;
let currentChatRecipient = null;

function register() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role: 'USER' }),
    })
        .then(response => {
            if (response.ok) {
                document.getElementById('auth-message').innerText = 'Registration successful! Please login.';
                document.getElementById('auth-message').style.color = 'green';
            } else {
                throw new Error('Registration failed');
            }
        })
        .catch(error => {
            document.getElementById('auth-message').innerText = error.message;
            document.getElementById('auth-message').style.color = 'red';
        });
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // For simplicity, we are just mocking a login check against the /auth/login endpoint
    // In a real app, you'd handle tokens/sessions clearer.
    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Login failed');
            }
        })
        .then(user => {
            currentUser = user;
            showChatSection();
            connectWebSocket();
        })
        .catch(error => {
            document.getElementById('auth-message').innerText = 'Invalid credentials';
            document.getElementById('auth-message').style.color = 'red';
        });
}

function showChatSection() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('chat-section').classList.remove('hidden');
    document.getElementById('user-display').innerText = `Logged in as: ${currentUser.username}`;
}

function logout() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    currentUser = null;
    currentChatRecipient = null;
    document.getElementById('chat-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('messages').innerHTML = '';
}

function connectWebSocket() {
    const socket = new SockJS('/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/user/' + currentUser.id + '/queue/messages', function (message) {
            showMessage(JSON.parse(message.body));
        });
    });
}

function startChat() {
    const recipientUsername = document.getElementById('recipient-input').value;
    // In a real app, you'd lookup the ID by username first. 
    // Here we assume the user knows the ID or we just use username if IDs are strings that match usernames (logic depends on your backend).
    // Based on User entity, ID is Long, but ChatController expects String senderId.

    // For this basic demo, we will assume the user enters the ID directly or we need a lookup.
    // Let's simplified assumption: User enters a numeric ID for now, or we need an endpoint to lookup ID by username.
    // IMPORTANT: The backend `ChatController` and `ChatService` use String for IDs in parameters, 
    // but User entity has Long id. The repository finds by SenderId (String). 
    // We will treat the input as the ID for this basic demo to avoid complexity of lookup UI.

    currentChatRecipient = recipientUsername; // Ideally this is the ID.
    document.getElementById('current-chat-with').innerText = `Chatting with User ID: ${currentChatRecipient}`;
    document.getElementById('messages').innerHTML = '';
    fetchChatHistory();
}

function fetchChatHistory() {
    if (!currentChatRecipient) return;

    // Convert IDs to string if needed. 
    const senderId = currentUser.id;
    const recipientId = currentChatRecipient;

    fetch(`/messages/${senderId}/${recipientId}`)
        .then(response => response.json())
        .then(messages => {
            document.getElementById('messages').innerHTML = '';
            messages.forEach(showMessage);
        });
}

function sendMessage() {
    const content = document.getElementById('message-content').value;
    if (!content || !currentChatRecipient) return;

    const message = {
        senderId: currentUser.id.toString(),
        recipientId: currentChatRecipient.toString(),
        content: content,
        timestamp: new Date()
    };

    stompClient.send("/app/chat", {}, JSON.stringify(message));
    showMessage(message); // Optimistically show own message
    document.getElementById('message-content').value = '';
}

function showMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');

    const isSent = message.senderId == currentUser.id;
    messageElement.classList.add('message', isSent ? 'sent' : 'received');

    const meta = document.createElement('div');
    meta.classList.add('meta');
    meta.innerText = isSent ? 'You' : `User ${message.senderId}`;

    const text = document.createElement('div');
    text.innerText = message.content;

    messageElement.appendChild(meta);
    messageElement.appendChild(text);
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
