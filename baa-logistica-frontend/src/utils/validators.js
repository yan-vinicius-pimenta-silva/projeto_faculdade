// ============================================
// src/utils/validators.js
// ============================================
import {
  sanitizeCPF,
  sanitizeCNPJ,
  sanitizeTelefone,
  sanitizeCNH,
  sanitizeRenavam,
  sanitizePlaca,
  sanitizeEstado,
  sanitizeCidade
} from './sanitization';

const allDigitsEqual = (value) => /^([0-9])\1*$/.test(value);

export const isValidCPF = (cpf) => {
  const digits = sanitizeCPF(cpf);
  if (digits.length !== 11 || allDigitsEqual(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let remainder = sum % 11;
  const first = remainder < 2 ? 0 : 11 - remainder;
  if (first !== parseInt(digits.charAt(9), 10)) {
    return false;
  }
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  remainder = sum % 11;
  const second = remainder < 2 ? 0 : 11 - remainder;
  return second === parseInt(digits.charAt(10), 10);
};

export const isValidCNPJ = (cnpj) => {
  const digits = sanitizeCNPJ(cnpj);
  if (digits.length !== 14 || allDigitsEqual(digits)) {
    return false;
  }
  const calcDigit = (length) => {
    let sum = 0;
    let weight = length - 7;
    for (let i = 0; i < length; i++) {
      sum += parseInt(digits.charAt(i), 10) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const first = calcDigit(12);
  const second = calcDigit(13);
  return first === parseInt(digits.charAt(12), 10) && second === parseInt(digits.charAt(13), 10);
};

export const isValidTelefone = (telefone) => {
  if (!telefone) return true;
  const digits = sanitizeTelefone(telefone);
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length < 10 || local.length > 11) {
    return false;
  }
  const ddd = parseInt(local.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  if (local.length === 11 && local.charAt(2) !== '9') {
    return false;
  }
  return true;
};

export const isValidCNH = (cnh) => {
  const digits = sanitizeCNH(cnh);
  if (digits.length !== 11 || allDigitsEqual(digits)) {
    return false;
  }
  let sum = 0;
  let weight = 9;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * weight;
    weight--;
  }
  let remainder = sum % 11;
  let first = remainder >= 10 ? 0 : remainder;
  if (remainder === 10) {
    sum += 2;
  }
  sum = 0;
  weight = 1;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * weight;
    weight++;
  }
  sum += first * 9;
  remainder = sum % 11;
  const second = remainder >= 10 ? 0 : remainder;
  return first === parseInt(digits.charAt(9), 10) && second === parseInt(digits.charAt(10), 10);
};

export const isValidRenavam = (renavam) => {
  const digits = sanitizeRenavam(renavam);
  if (digits.length !== 11 || allDigitsEqual(digits)) {
    return false;
  }
  let sum = 0;
  let weight = 3;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const remainder = sum % 11;
  const digit = remainder === 10 ? 0 : remainder;
  return digit === parseInt(digits.charAt(10), 10);
};

export const isValidPlaca = (placa) => {
  const value = sanitizePlaca(placa);
  return /^[A-Z]{3}\d{4}$/.test(value) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(value);
};

export const isValidAnoFabricacao = (ano) => {
  const current = new Date().getFullYear();
  const numero = Number(ano);
  return Number.isInteger(numero) && numero >= 1900 && numero <= current + 1;
};

export const isValidPositiveDecimal = (value, allowZero = false) => {
  const numero = Number(value);
  if (Number.isNaN(numero)) {
    return false;
  }
  return allowZero ? numero >= 0 : numero > 0;
};

export const isValidEstado = (uf) => {
  const value = sanitizeEstado(uf);
  return /^[A-Z]{2}$/.test(value);
};

export const isValidCidade = (cidade) => {
  const value = sanitizeCidade(cidade);
  return value.length > 0;
};

export const isValidDate = (value) => {
  if (!value) return false;
  const [ano, mes, dia] = value.split('-').map(Number);
  if (!ano || !mes || !dia) return false;
  const date = new Date(ano, mes - 1, dia);
  return date.getFullYear() === ano && date.getMonth() === mes - 1 && date.getDate() === dia;
};

export const isFutureDate = (value) => {
  if (!isValidDate(value)) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [ano, mes, dia] = value.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data > hoje;
};

export const isPastOrToday = (value) => {
  if (!isValidDate(value)) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [ano, mes, dia] = value.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data <= hoje;
};

export const hasMinimumAge = (value, minAge) => {
  if (!isValidDate(value)) return false;
  const [ano, mes, dia] = value.split('-').map(Number);
  const nascimento = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesDiff = hoje.getMonth() - nascimento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade >= minAge;
};

export const isValidDateTime = (value) => {
  if (!value) return false;
  const [datePart, timePart] = value.split('T');
  if (!timePart) return false;
  const [hour, minute] = timePart.split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return false;
  return isValidDate(datePart) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
};

export const compareDateTimes = (start, end) => {
  if (!isValidDateTime(start) || !isValidDateTime(end)) {
    return null;
  }
  return new Date(end) - new Date(start);
};

export const isValidCEP = (cep) => /^(\d{5}-\d{3}|\d{8})$/.test(cep);

export default {
  isValidCPF,
  isValidCNPJ,
  isValidTelefone,
  isValidCNH,
  isValidRenavam,
  isValidPlaca,
  isValidAnoFabricacao,
  isValidPositiveDecimal,
  isValidEstado,
  isValidCidade,
  isValidDate,
  isFutureDate,
  isPastOrToday,
  hasMinimumAge,
  isValidDateTime,
  compareDateTimes,
  isValidCEP
};
