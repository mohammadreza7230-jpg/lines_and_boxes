import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const COACH_SYSTEM_INSTRUCTION = `تو «مربی تاکتیکی سایبری» در بازی نئونی «نقطه بازی - نبرد سایبری» (Dots and Boxes) هستی.
شخصیت و لحن:
- به زبان فارسی روان، دقیق، صمیمی و با حس رقابت حرفه‌ای و سایبرپانک صحبت کن.
- پاسخ‌ها را کوتاه، ساختاریافته و کاربردی نگه دار (معمولاً ۳ تا ۶ خط یا بولت کوتاه)، مگر اینکه کاربر توضیح عمیق بخواهد.

تخصص تو در بازی نقطه و خط (Dots and Boxes):
- تشخیص حرکات امن (خطوطی که ضلع سوم هیچ خانه‌ای را نمی‌سازند).
- شمارش طول زنجیره‌ها (Chains) و حلقه‌ها (Loops).
- توضیح و آموزش تکنیک‌های پیشرفته مثل «قربانی هوشمند / دوگانه» (Double-Cross / Hard-Hearted Handout) و قانون زوجیت (Parity).
- اگر وضعیت فعلی صفحه بازی (Board Context) همراه پیام فرستاده شده بود، دقیقاً بر اساس امتیازها، سایز زمین، تعداد حرکات امن باقی‌مانده، خانه‌های ۳ضلعی آماده تصاحب و نوبت فعلی، بهترین توصیه تاکتیکی را ارائه بده.
- هرگز خطوط مورب پیشنهاد نده؛ در نقطه بازی فقط خطوط افقی و عمودی بین دو نقطه مجاور مجاز هستند.`;

interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

interface BoardContextInput {
  gridSize: number;
  mode: 'local' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
  scores: { p1: number; p2: number };
  currentPlayer: 1 | 2;
  totalBoxes: number;
  safeMovesCount: number;
  capturableBoxesCount: number;
  shortestChainOffer: number | null;
  movesPlayed: number;
  asciiSummary?: string;
}

app.post('/api/coach/chat', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'کلید API جمنای پیکربندی نشده است. لطفاً در بخش Settings > Secrets کلید را بررسی کنید.',
      });
      return;
    }

    const {
      message,
      history = [],
      highThinking = false,
      boardContext = null,
    } = req.body as {
      message?: string;
      history?: ChatMessageInput[];
      highThinking?: boolean;
      boardContext?: BoardContextInput | null;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'پیام نمی‌تواند خالی باشد.' });
      return;
    }

    const sanitizedHistory = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              (item.role === 'user' || item.role === 'model') &&
              typeof item.text === 'string' &&
              item.text.trim().length > 0
          )
          .slice(-16)
          .map((item) => ({
            role: item.role,
            parts: [{ text: item.text }],
          }))
      : [];

    let contextualPrompt = message.trim();
    if (boardContext && typeof boardContext === 'object') {
      const turnLabel =
        boardContext.currentPlayer === 1
          ? 'بازیکن ۱ (قرمز)'
          : boardContext.mode === 'ai'
            ? 'هوش مصنوعی (آبی)'
            : 'بازیکن ۲ (آبی)';
      const ctxLines = [
        `[وضعیت زنده صفحه بازی]`,
        `- سایز شبکه نقاط: ${boardContext.gridSize}x${boardContext.gridSize} (کل خانه‌ها: ${boardContext.totalBoxes})`,
        `- حالت بازی: ${boardContext.mode === 'ai' ? `مقابل هوش مصنوعی (${boardContext.difficulty})` : 'نبرد محلی ۲ نفره'}`,
        `- امتیاز فعلی: بازیکن ۱ = ${boardContext.scores.p1} | حریف = ${boardContext.scores.p2}`,
        `- نوبت فعلی: ${turnLabel}`,
        `- تعداد حرکات انجام‌شده: ${boardContext.movesPlayed}`,
        `- خانه‌های ۳ضلعی آماده تصاحب فوری: ${boardContext.capturableBoxesCount}`,
        `- حرکات امن باقی‌مانده (بدون ساختن خانه ۳ضلعی): ${boardContext.safeMovesCount}`,
        boardContext.shortestChainOffer !== null
          ? `- کوتاه‌ترین زنجیره‌ای که در صورت نبود حرکت امن باز می‌شود: ${boardContext.shortestChainOffer} خانه`
          : '',
        boardContext.asciiSummary ? `نقشه خلاصه وضعیت:\n${boardContext.asciiSummary}` : '',
        `[سوال کاربر]: ${message.trim()}`,
      ].filter(Boolean);
      contextualPrompt = ctxLines.join('\n');
    }

    const modelName = highThinking ? 'gemini-4-hydrogen' : 'gemini-3.1-flash-lite';

    const chat = ai.chats.create({
      model: modelName,
      history: sanitizedHistory,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        ...(highThinking
          ? {
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.HIGH,
              },
            }
          : {}),
      },
    });

    const response = await chat.sendMessage({
      message: contextualPrompt,
    });

    const reply = response.text?.trim();
    if (!reply) {
      res.status(502).json({ error: 'پاسخی از مدل هوشمند دریافت نشد. لطفاً دوباره تلاش کنید.' });
      return;
    }

    res.json({
      reply,
      model: modelName,
      highThinking: Boolean(highThinking),
    });
  } catch (err: unknown) {
    const errorObj = err as { status?: number; message?: string };
    const status = typeof errorObj?.status === 'number' ? errorObj.status : 500;
    const rawMsg = errorObj?.message || 'خطای غیرمنتظره در ارتباط با سرویس هوش مصنوعی.';

    if (status === 403 || status === 401 || rawMsg.includes('API_KEY_INVALID')) {
      res.status(403).json({
        error: 'کلید API معتبر نیست یا دسترسی ندارد. لطفاً کلید را در Settings > Secrets بررسی کنید.',
      });
      return;
    }
    if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      res.status(429).json({
        error: 'سهمیه درخواست‌های هوش مصنوعی موقتاً پر شده است. کمی بعد دوباره امتحان کنید.',
      });
      return;
    }

    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: rawMsg,
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cyber Dots & Boxes server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
