"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const SPARKPOST_URL = "https://api.sparkpost.com/api/v1/transmissions";
const CONTACT_EMAIL = "samuel.huarachi@gmail.com";
const escapeHtml = function (value) {
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
router.get("/", function (_req, res) {
    res.render("index");
});
router.post("/contact/send-email", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const nome = String(req.body.nome || "").trim();
        const empresa = String(req.body.empresa || "").trim();
        const objetivo = String(req.body.objetivo || "").trim();
        if (!nome || !empresa || !objetivo) {
            return res.status(400).json({
                message: "Preencha todos os campos do formulario.",
            });
        }
        if (!process.env.SPARKPOST_KEY) {
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
                <p><strong>Objetivo:</strong></p>
                <p>${escapeHtml(objetivo).replace(/\n/g, "<br>")}</p>
            `,
            },
        };
        try {
            const request = yield fetch(SPARKPOST_URL, {
                method: "POST",
                headers: {
                    Authorization: process.env.SPARKPOST_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(content),
            });
            if (!request.ok) {
                return res.status(502).json({
                    message: "Nao foi possivel enviar o email agora.",
                });
            }
            return res.status(200).json({
                message: "Mensagem enviada com sucesso.",
            });
        }
        catch (_error) {
            return res.status(502).json({
                message: "Nao foi possivel enviar o email agora.",
            });
        }
    });
});
module.exports = router;
