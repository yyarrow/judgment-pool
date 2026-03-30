let socket = null;

export function connect(taskId, token, onMessage) {
  if (socket) disconnect();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  socket = new WebSocket(`${protocol}//${host}/ws?token=${token}&taskId=${taskId}`);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {}
  };

  socket.onerror = () => {};
  socket.onclose = () => { socket = null; };
}

export function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
