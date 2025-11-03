// ============================================
// src/utils/sanitization.js
// ============================================
/*
 * Conjunto de utilitários responsáveis por sanitizar campos de entrada.
 * Todas as funções retornam strings normalizadas em UTF-8 (normalize NFC)
 * e aplicam trim nos valores quando apropriado.
 */

const NFC = 'NFC';

const toNFC = (value) => (value ?? '').normalize(NFC);

export const removeHTML = (value) => toNFC(value).replace(/<[^>]*>/gi, '');

export const removeScripts = (value) => toNFC(value).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

export const removeEmojis = (value) => toNFC(value).replace(/\p{Extended_Pictographic}/gu, '');

const trimAndCollapseSpaces = (value) => toNFC(value).replace(/\s+/g, ' ').trim();

export const sanitizeNomeCompleto = (value, maxLength = 100) =>
  trimAndCollapseSpaces(value)
    .replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    .slice(0, maxLength);

export const sanitizeEndereco = (value, maxLength = 120) =>
  trimAndCollapseSpaces(removeHTML(removeScripts(value)))
    .replace(/[^A-Za-zÀ-ÿ0-9\s,.-]/g, '')
    .slice(0, maxLength);

export const sanitizeObservacoes = (value, maxLength = 150) =>
  trimAndCollapseSpaces(removeEmojis(removeHTML(removeScripts(value)))).slice(0, maxLength);

export const sanitizeEmail = (value, maxLength = 320) =>
  trimAndCollapseSpaces(value)
    .replace(/[^a-zA-Z0-9.@!#$%&'*+\-/=?^_`{|}~]/g, '')
    .toLowerCase()
    .slice(0, maxLength);

export const sanitizeTelefone = (value) =>
  toNFC(value).replace(/\D/g, '').slice(0, 13); // +55 + 11 dígitos

export const sanitizeCPF = (value) => toNFC(value).replace(/\D/g, '').slice(0, 11);

export const sanitizeCNPJ = (value) => toNFC(value).replace(/\D/g, '').slice(0, 14);

export const sanitizeCNH = (value) => toNFC(value).replace(/\D/g, '').slice(0, 11);

export const sanitizeCEP = (value) => toNFC(value).replace(/\D/g, '').slice(0, 8);

export const sanitizeCidade = (value, maxLength = 60) =>
  trimAndCollapseSpaces(value)
    .replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    .slice(0, maxLength);

export const sanitizeEstado = (value) =>
  toNFC(value)
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 2);

export const sanitizePlaca = (value) =>
  toNFC(value)
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 7);

export const sanitizeModeloOuMarca = (value, maxLength = 60) =>
  trimAndCollapseSpaces(value)
    .replace(/[^A-Za-zÀ-ÿ0-9\s-]/g, '')
    .slice(0, maxLength);

export const sanitizeChassi = (value) =>
  toNFC(value)
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 17);

export const sanitizeNumero = (value) => toNFC(value).replace(/[^0-9]/g, '');

export const sanitizeRenavam = (value) => sanitizeNumero(value).slice(0, 11);

export const sanitizeDecimal = (value) =>
  toNFC(value)
    .replace(/[^0-9.,]/g, '')
    .replace(/,/g, '.')
    .replace(/(\..*)\./g, '$1');

export const sanitizeRazaoSocial = (value, maxLength = 120) =>
  trimAndCollapseSpaces(removeHTML(removeScripts(value)))
    .replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '')
    .slice(0, maxLength);

export const sanitizePessoaContato = (value, maxLength = 80) =>
  trimAndCollapseSpaces(value)
    .replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    .slice(0, maxLength);

export const sanitizeDescricao = (value, maxLength = 150) =>
  trimAndCollapseSpaces(removeHTML(removeScripts(value))).slice(0, maxLength);

export const sanitizeDateInput = (value) => trimAndCollapseSpaces(value).slice(0, 10);

export const sanitizeDateTimeInput = (value) => trimAndCollapseSpaces(value).slice(0, 16);

export const sanitizeLogin = (value, maxLength = 50) =>
  trimAndCollapseSpaces(value)
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, maxLength);

export const sanitizeCargo = (value, maxLength = 80) =>
  trimAndCollapseSpaces(removeHTML(removeScripts(value)))
    .replace(/[^A-Za-zÀ-ÿ0-9\s-]/g, '')
    .slice(0, maxLength);

export const sanitizeSenha = (value, maxLength = 128) => toNFC(value).slice(0, maxLength);

export const sanitizeTextoGenerico = (value, maxLength = 150) =>
  trimAndCollapseSpaces(removeHTML(removeScripts(value))).slice(0, maxLength);

export const maskCPF = (cpf) => {
  const numeros = sanitizeCPF(cpf);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
};

export const maskCNPJ = (cnpj) => {
  const numeros = sanitizeCNPJ(cnpj);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
  if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
  if (numeros.length <= 12) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
  }
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
};

export const maskTelefone = (telefone) => {
  const numeros = sanitizeTelefone(telefone);
  const local = numeros.startsWith('55') ? numeros.slice(2) : numeros;
  if (local.length <= 2) return local;
  if (local.length <= 6) return `(${local.slice(0, 2)}) ${local.slice(2)}`;
  if (local.length <= 10) return `(${local.slice(0, 2)}) ${local.slice(2, local.length - 4)}-${local.slice(-4)}`;
  return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7, 11)}`;
};

export const formatTelefoneToE164 = (telefone) => {
  const numeros = sanitizeTelefone(telefone);
  if (numeros.startsWith('55')) {
    return `+${numeros}`;
  }
  if (numeros.length >= 10) {
    return `+55${numeros}`;
  }
  return null;
};

export const maskCEP = (cep) => {
  const numeros = sanitizeCEP(cep);
  if (numeros.length <= 5) return numeros;
  return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
};

export const maskRenavam = (value) => sanitizeNumero(value).slice(0, 11);

export const maskCNH = (value) => sanitizeCNH(value);

export const maskPlaca = (value) => {
  const sanitized = sanitizePlaca(value);
  if (sanitized.length <= 3) return sanitized;
  if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(sanitized)) {
    return sanitized;
  }
  if (sanitized.length > 3) {
    return `${sanitized.slice(0, 3)}-${sanitized.slice(3)}`;
  }
  return sanitized;
};

export const maskCurrency = (value) => {
  const sanitized = sanitizeDecimal(value);
  const numero = sanitized === '' ? 0 : Number(sanitized);
  if (Number.isNaN(numero)) {
    return '';
  }
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const clampToMaxLength = (value, maxLength) => toNFC(value).slice(0, maxLength);

export default {
  sanitizeNomeCompleto,
  sanitizeEndereco,
  sanitizeObservacoes,
  sanitizeEmail,
  sanitizeTelefone,
  sanitizeCPF,
  sanitizeCNPJ,
  sanitizeCNH,
  sanitizeCEP,
  sanitizeCidade,
  sanitizeEstado,
  sanitizePlaca,
  sanitizeModeloOuMarca,
  sanitizeChassi,
  sanitizeNumero,
  sanitizeRenavam,
  sanitizeDecimal,
  sanitizeRazaoSocial,
  sanitizePessoaContato,
  sanitizeDescricao,
  sanitizeDateInput,
  sanitizeDateTimeInput,
  sanitizeLogin,
  sanitizeCargo,
  sanitizeSenha,
  sanitizeTextoGenerico,
  maskCPF,
  maskCNPJ,
  maskTelefone,
  maskCEP,
  maskRenavam,
  maskCNH,
  maskPlaca,
  maskCurrency,
  formatTelefoneToE164,
  clampToMaxLength,
  removeHTML,
  removeScripts,
  removeEmojis
};
