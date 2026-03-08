import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, phone, service, message } = await request.json();

    if (!name || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Пожалуйста заполните имя и телефон",
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

    return new Response(
      JSON.stringify({
        success: true,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
      }),
      { status: 500 }
    );
  }
};