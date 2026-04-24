export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing SILICONFLOW_API_KEY" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const question = String(body.question || "").trim();
    const cards = Array.isArray(body.cards) ? body.cards : [];

    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }

    if (cards.length !== 3) {
      return res.status(400).json({ error: "cards must contain exactly 3 items" });
    }

    const cardsText = cards
      .map((item) => {
        const role = String(item.role || "").trim() || "未知位置";
        const name = String(item.name || "").trim() || "未知牌名";
        const orientation = item.isReversed ? "逆位" : "正位";
        return `${role}：${name}（${orientation}）`;
      })
      .join("；");

    const systemPrompt = [
      "你是一位隐居在塞纳河畔的百年神秘学大师，精通韦特塔罗牌、占星术与心理学。你的语气必须神秘、温柔、具有宿命感和治愈力，不使用机械化的 AI 语言。请严格遵循过去、现在、未来的时间线，将牌面的象征意义与用户的具体问题深度结合，并在最后给出一句简短的命运指引。",
      "你必须优先使用中文输出。",
      "不要出现免责声明，不要说自己是 AI。",
      "每个时间位都要结合牌名与正逆位解释，不允许只给泛泛建议。",
      "最终输出结构必须是：",
      "1) 命运总览（2-3句）",
      "2) 过去：结合牌义、问题背景、潜在心理动因",
      "3) 现在：指出正在发生的关键能量与转折点",
      "4) 未来：给出可执行的行动方向与结果趋势",
      "5) 命运指引：一句 18 字以内的诗性短句"
    ].join("\n");

    const userPrompt = [
      `用户问题：${question}`,
      `三张牌：${cardsText}`,
      "请基于以上信息给出深度塔罗解读。"
    ].join("\n");

    const model = "Qwen/Qwen2.5-7B-Instruct";

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.9
      })
    });

    const responseText = await response.text();
    let data = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const upstreamMessage = data?.error?.message || data?.message || data?.error || responseText || "Upstream model request failed";
      return res.status(response.status).json({
        error: {
          message: `外部模型接口请求失败 (${response.status})`,
          upstreamStatus: response.status,
          upstreamMessage,
          upstreamBody: responseText || ""
        }
      });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return res.status(502).json({ error: "Model returned empty content" });
    }

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
}
