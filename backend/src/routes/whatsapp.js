const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const fiscalAgent = require('../agents/fiscal-agent');

const router = express.Router();
const limiter = rateLimit({
  windowMs: Number(process.env.WHATSAPP_RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.WHATSAPP_RATE_LIMIT_MAX || 20),
});

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizePhone(value) {
  const phone = digitsOnly(value);
  return phone || String(value || '').trim();
}

function isOwnerPhone(phone) {
  const configured = digitsOnly(process.env.WHATSAPP_OWNER_PHONE);
  if (!configured) {
    return false;
  }

  return digitsOnly(phone) === configured;
}

function extractMetaWebhookMessage(body = {}) {
  const value = body.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!message) {
    return null;
  }

  return {
    from: normalizePhone(message.from || value?.metadata?.display_phone_number),
    to: normalizePhone(value?.metadata?.display_phone_number || body.to),
    name: contact?.profile?.name || body.name || null,
    messageId: message.id || body.messageId || null,
    text: message.text?.body || message.body || message.caption || '',
    context: {
      type: message.type || body.type || 'text',
      raw: body,
    },
  };
}

function extractMessage(body = {}) {
  return extractMetaWebhookMessage(body) || {
    from: normalizePhone(body.from || body.phone || body.sender),
    to: normalizePhone(body.to || body.recipient),
    name: body.name || body.contact_name || null,
    messageId: body.messageId || body.id || null,
    text: body.text || body.message || body.body || '',
    context: {
      ...((body.context && typeof body.context === 'object') ? body.context : {}),
      raw: body,
    },
  };
}

async function forwardToProvider({ to, text, metadata = {} }) {
  const providerUrl = process.env.WHATSAPP_PROVIDER_URL;
  if (!providerUrl) {
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (process.env.WHATSAPP_PROVIDER_TOKEN) {
    headers.Authorization = 'Bearer ' + process.env.WHATSAPP_PROVIDER_TOKEN;
  }

  const response = await axios.post(
    providerUrl,
    {
      to,
      text,
      metadata,
    },
    { headers, timeout: 30000 }
  );

  return response.data;
}

router.get('/webhook', (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_TOKEN;
  const challenge = req.query['hub.challenge'];
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];

  if (verifyToken) {
    if (mode === 'subscribe' && token === verifyToken) {
      return res.status(200).send(challenge || 'OK');
    }

    return res.status(403).send('Forbidden');
  }

  return res.status(200).send(challenge || 'OK');
});

router.post('/webhook', limiter, async (req, res) => {
  try {
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (expectedSecret && req.headers['x-whatsapp-secret'] !== expectedSecret) {
      return res.status(403).json({ error: 'Invalid webhook secret' });
    }

    const inbound = extractMessage(req.body || {});
    if (!inbound.from || !String(inbound.text || '').trim()) {
      return res.status(400).json({ error: 'from and text are required' });
    }

    const ownerMessage = isOwnerPhone(inbound.from);
    const user = {
      id: inbound.from,
      name: inbound.name || inbound.from,
      role: ownerMessage ? 'owner' : 'client',
    };

    const result = await fiscalAgent.chat({
      message: String(inbound.text),
      user,
      context: {
        ...inbound.context,
        canal: 'whatsapp',
        origem: ownerMessage ? 'owner' : 'client',
        telefone: inbound.from,
        destinatario: inbound.to,
        cliente: inbound.name || inbound.from,
      },
    });

    await fiscalAgent.saveConversation({
      userId: inbound.from,
      userMessage: String(inbound.text),
      assistantMessage: result.answer,
      conversationType: 'whatsapp',
      metadata: {
        from: inbound.from,
        to: inbound.to || null,
        owner: ownerMessage,
        messageId: inbound.messageId,
        name: inbound.name || null,
        channel: 'whatsapp',
      },
    });

    const delivery = await forwardToProvider({
      to: inbound.from,
      text: result.answer,
      metadata: {
        replyTo: inbound.messageId,
        from: inbound.to || null,
        owner: ownerMessage,
      },
    }).catch(() => null);

    return res.json({
      ok: true,
      from: inbound.from,
      owner: ownerMessage,
      reply: result.answer,
      delivery: delivery ? 'sent' : 'queued',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/send', limiter, authMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const to = normalizePhone(payload.to || payload.phone || payload.recipient);
    const message = String(payload.message || payload.text || '').trim();

    if (!to || !message) {
      return res.status(400).json({ error: 'to and message are required' });
    }

    const delivery = await forwardToProvider({
      to,
      text: message,
      metadata: {
        senderId: req.user.id,
        senderName: req.user.name || null,
        recipientName: payload.name || null,
        channel: 'whatsapp',
      },
    });

    await fiscalAgent.saveConversation({
      userId: req.user.id,
      userMessage: `WhatsApp enviado para ${to}: ${message}`,
      assistantMessage: message,
      conversationType: 'whatsapp',
      metadata: {
        direction: 'outbound',
        to,
        from: req.user.id,
        name: payload.name || null,
        delivery: delivery || null,
        channel: 'whatsapp',
      },
    });

    return res.json({
      ok: true,
      to,
      message,
      delivery: delivery ? 'sent' : 'queued',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
