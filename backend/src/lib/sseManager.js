// userId → Set<Response>  (1 user có thể mở nhiều tab/device)
const clients = new Map();

function addClient(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
}

function removeClient(userId, res) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
}

function sendToUser(userId, data) {
  const set = clients.get(userId);
  if (!set) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch {
      // connection broken — bỏ qua, cleanup sẽ chạy khi req.close
    }
  }
}

module.exports = { addClient, removeClient, sendToUser };
