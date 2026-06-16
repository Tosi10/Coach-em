"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPasswordStrengthErrorMessage = getPasswordStrengthErrorMessage;
const PASSWORD_MIN_LENGTH = 8;
function getPasswordStrengthIssue(password) {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        return "minLength";
    }
    if (!/[A-Z]/.test(password)) {
        return "uppercase";
    }
    if (!/[a-z]/.test(password)) {
        return "lowercase";
    }
    if (!/[0-9]/.test(password)) {
        return "number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return "special";
    }
    return null;
}
function getPasswordStrengthErrorMessage(password) {
    const issue = getPasswordStrengthIssue(password);
    if (!issue)
        return null;
    switch (issue) {
        case "minLength":
            return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
        case "uppercase":
            return "Inclua pelo menos uma letra maiúscula na senha.";
        case "lowercase":
            return "Inclua pelo menos uma letra minúscula na senha.";
        case "number":
            return "Inclua pelo menos um número na senha.";
        case "special":
            return "Inclua pelo menos um caractere especial (ex.: @, #, $).";
        default:
            return "Crie uma senha mais forte.";
    }
}
