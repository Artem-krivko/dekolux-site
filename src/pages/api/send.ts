import type { APIRoute } from "astro";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const body = await request.json();

    const name = clean(body.name);
    const phone = clean(body.phone);
    const service = clean(body.service);
    const message = clean(body.message);
    const company = clean(body.company);

    // Honeypot: если поле заполнено — считаем ботом
    if (company) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Базовая валидация
    if (!name || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Пожалуйста, заполните имя и телефон.",
        }),
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 60) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Пожалуйста, укажите корректное имя.",
        }),
        { status: 400 }
      );
    }

    if (phone.length < 7 || phone.length > 25) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Пожалуйста, укажите корректный телефон.",
        }),
        { status: 400 }
      );
    }

    if (service.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Поле услуги заполнено некорректно.",
        }),
        { status: 400 }
      );
    }

    if (message.length > 1500) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Комментарий слишком длинный.",
        }),
        { status: 400 }
      );
    }

    // Очень грубая антиспам-проверка
    const spamMarkers = ["http://", "https://", "<a ", "[url", "casino", "crypto"];
    const combined = `${name} ${phone} ${service} ${message}`.toLowerCase();

    if (spamMarkers.some((marker) => combined.includes(marker))) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Заявка похожа на спам.",
        }),
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RESEND_API_KEY is missing",
        }),
        { status: 500 }
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Dekolux <onboarding@resend.dev>",
        to: ["krivko219319@gmail.com"],
        subject: "Новая заявка с сайта Dekolux",
        html: `
          <h2>Новая заявка с сайта</h2>
          <p><strong>Имя:</strong> ${name}</p>
          <p><strong>Телефон:</strong> ${phone}</p>
          <p><strong>Услуга:</strong> ${service || "Не указана"}</p>
          <p><strong>Комментарий:</strong> ${message || "Не указан"}</p>
          <p><strong>IP:</strong> ${clientAddress ?? "unknown"}</p>
        `,
      }),
    });

    const data = await resendResponse.text();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data,
        }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
      }),
      { status: 500 }
    );
  }
};