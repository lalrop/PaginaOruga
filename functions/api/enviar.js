/* =====================================================
   ORUGA37 — Envío seguro de formularios a Telegram
   Cloudflare Pages Function: POST /api/enviar

   Variables de entorno (Cloudflare → Pages → paginaoruga →
   Configuración → Variables y secretos):
     TELEGRAM_TOKEN   (secreto)  token del bot entregado por @BotFather
     TELEGRAM_CHAT_ID (texto)    chat que recibe los mensajes
===================================================== */

const MAX_ARCHIVO = 10 * 1024 * 1024; // 10 MB
const MAX_TEXTO   = 3500;             // Telegram admite 4096 caracteres por mensaje

const esc = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const campo = (form, nombre, max = 300) =>
  String(form.get(nombre) || '').trim().slice(0, max);

const json = (ok, mensaje, status = 200) =>
  new Response(JSON.stringify({ ok, mensaje }), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });

async function telegram(env, metodo, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/${metodo}`, {
    method: 'POST', body
  });
  const data = await res.json().catch(() => ({ ok: false }));
  return data.ok === true;
}

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json(false, 'El formulario no está configurado. Escríbenos por WhatsApp.', 500);
  }

  let form;
  try { form = await request.formData(); }
  catch { return json(false, 'Datos inválidos.', 400); }

  // Trampa anti-spam: campo oculto que una persona nunca llena
  if (campo(form, 'sitio_web')) return json(true, 'Enviado.');

  const tipo = campo(form, 'tipo', 20);
  let texto, archivo, metodoArchivo, campoArchivo, caption;

  if (tipo === 'empleo') {
    const nombre      = campo(form, 'nombre', 120);
    const telefono    = campo(form, 'telefono', 40);
    const correo      = campo(form, 'correo', 120);
    const experiencia = campo(form, 'experiencia', MAX_TEXTO);
    if (!nombre || !telefono || !experiencia) {
      return json(false, 'Completa nombre, experiencia y teléfono.', 400);
    }
    texto = '&lt;Oruga37 empleo&gt;\n\n<b>NUEVA POSTULACIÓN</b>\n\n'
      + `<b>Nombre:</b> ${esc(nombre)}\n<b>Teléfono:</b> ${esc(telefono)}\n`
      + (correo ? `<b>Correo:</b> ${esc(correo)}\n` : '')
      + `\n<b>Experiencia:</b>\n${esc(experiencia)}`;
    archivo = form.get('archivo');
    metodoArchivo = 'sendDocument'; campoArchivo = 'document';
    caption = `CV de: ${nombre}`;

  } else if (tipo === 'articulo') {
    const titulo    = campo(form, 'titulo', 200);
    const contenido = campo(form, 'contenido', MAX_TEXTO);
    if (!titulo || !contenido) {
      return json(false, 'Completa el título y el contenido.', 400);
    }
    texto = '&lt;Oruga37 artículo&gt;\n\n📝 <b>NUEVO ARTÍCULO PARA EL BLOG</b>\n\n'
      + `<b>Título:</b> ${esc(titulo)}\n\n<b>Contenido:</b>\n${esc(contenido)}`;
    archivo = form.get('archivo');
    metodoArchivo = 'sendPhoto'; campoArchivo = 'photo';
    caption = `📸 Imagen para: ${titulo}`;

  } else {
    return json(false, 'Formulario desconocido.', 400);
  }

  const tieneArchivo = archivo && typeof archivo === 'object' && archivo.size > 0;
  if (tieneArchivo && archivo.size > MAX_ARCHIVO) {
    return json(false, 'El archivo supera los 10 MB.', 400);
  }

  const msg = new FormData();
  msg.append('chat_id', env.TELEGRAM_CHAT_ID);
  msg.append('text', texto);
  msg.append('parse_mode', 'HTML');
  if (!(await telegram(env, 'sendMessage', msg))) {
    return json(false, 'No se pudo enviar. Intenta de nuevo o escríbenos por WhatsApp.', 502);
  }

  if (tieneArchivo) {
    const fd = new FormData();
    fd.append('chat_id', env.TELEGRAM_CHAT_ID);
    fd.append(campoArchivo, archivo, archivo.name);
    fd.append('caption', caption.slice(0, 1000));
    // Si una imagen no se puede enviar como foto, se reintenta como documento
    if (!(await telegram(env, metodoArchivo, fd)) && metodoArchivo === 'sendPhoto') {
      const fd2 = new FormData();
      fd2.append('chat_id', env.TELEGRAM_CHAT_ID);
      fd2.append('document', archivo, archivo.name);
      fd2.append('caption', caption.slice(0, 1000));
      await telegram(env, 'sendDocument', fd2);
    }
  }

  return json(true, 'Enviado correctamente.');
}

export function onRequest() {
  return json(false, 'Método no permitido.', 405);
}
