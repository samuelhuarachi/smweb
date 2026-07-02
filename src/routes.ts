import express from "express";
import * as emailValidator from "email-validator";
import {
    checkContactRateLimit,
    deleteContactSubmission,
    recordContactSubmission,
} from "./contact-rate-limit";

const router = express.Router();
const SPARKPOST_URL = "https://api.sparkpost.com/api/v1/transmissions";
const CONTACT_EMAIL = "samuel.huarachi@gmail.com";

const escapeHtml = function (value: string) {
    return value.replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
};

const getClientIp = function (req: express.Request) {
    return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
        .split(",")[0]
        .trim();
};

router.get("/", function (_req, res) {
    res.render("index");
});

router.post("/contact/send-email", async function (req, res) {
    const nome = String(req.body.nome || "").trim();
    const empresa = String(req.body.empresa || "").trim();
    const email = String(req.body.email || "").trim();
    const objetivo = String(req.body.objetivo || "").trim();

    if (!nome || !empresa || !email || !objetivo) {
        return res.status(400).json({
            message: "Preencha todos os campos do formulario.",
        });
    }

    if (!emailValidator.validate(email)) {
        return res.status(400).json({
            message: "Informe um e-mail valido.",
        });
    }

    if (!process.env.SPARKPOST_KEY) {
        return res.status(500).json({
            message: "Erro interno.",
        });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkContactRateLimit(ip, email);

    if (!rateLimit.allowed) {
        const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
        return res.status(429).json({
            message: `Voce ja enviou uma mensagem recentemente. Aguarde ${minutes} minuto(s) antes de tentar novamente.`,
        });
    }

    let submissionId: number;

    try {
        submissionId = await recordContactSubmission(ip, email);
    } catch (_error) {
        return res.status(500).json({
            message: "Erro interno.",
        });
    }

    const content = {
        options: {
            open_tracking: true,
            click_tracking: true,
        },
        recipients: [
            {
                address: {
                    email: CONTACT_EMAIL,
                    name: "Samuel Huarachi",
                },
            },
        ],
        content: {
            from: {
                name: "SM WEB",
                email: "no-reply@smweb.com.br",
            },
            subject: `Novo contato pelo site - ${empresa}`,
            html: `
                <h1>Novo contato pelo site</h1>
                <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
                <p><strong>Empresa:</strong> ${escapeHtml(empresa)}</p>
                <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
                <p><strong>Objetivo:</strong></p>
                <p>${escapeHtml(objetivo).replace(/\n/g, "<br>")}</p>
            `,
        },
    };

    try {
        const request = await fetch(SPARKPOST_URL, {
            method: "POST",
            headers: {
                Authorization: process.env.SPARKPOST_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(content),
        });

        if (!request.ok) {
            await deleteContactSubmission(submissionId);
            return res.status(502).json({
                message: "Nao foi possivel enviar o email agora.",
            });
        }

        return res.status(200).json({
            message: "Mensagem enviada com sucesso.",
        });
    } catch (_error) {
        await deleteContactSubmission(submissionId);
        return res.status(502).json({
            message: "Nao foi possivel enviar o email agora.",
        });
    }
});

module.exports = router;
