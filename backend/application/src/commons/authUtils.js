import pkg from 'crypto-js';
import { APP_NAME, LOGIN_URL } from './constants.js';
const { SHA512 } = pkg;

export const hashPassword = (password) => {
    const hash = SHA512(password).toString()
    return hash;
}

export const generatePassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

    const values = new Uint32Array(length);
    crypto.getRandomValues(values);

    return Array.from(values, v => charset[v % charset.length]).join("");
}

export const newPasswordTemplate = (email, name, temporaryPassword) => {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Nuova password temporanea</h2>

      <p>
        Ciao ${name}, è stata generata una nuova password temporanea per il tuo account ${email}.
      </p>

      <p>
        <strong>Password temporanea:</strong>
      </p>

      <div
        style="
          background-color: #f4f4f4;
          padding: 12px;
          border-radius: 6px;
          font-size: 18px;
          font-weight: bold;
          width: fit-content;
        "
      >
        ${temporaryPassword.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")}
      </div>

      <p style="margin-top: 20px;">
        Per motivi di sicurezza, ti consigliamo di modificare la password
        il prima possibile dopo aver effettuato l'accesso.
      </p>

      <p>
        Accedi alla piattaforma:
      </p>

      <p>
        <a href="${LOGIN_URL}">
          ${LOGIN_URL}
        </a>
      </p>

      <p>
        Se non hai richiesto questa modifica, contatta immediatamente il supporto.
      </p>

      <br />

      <p>
        Cordiali saluti,<br />
        Team ${APP_NAME}
      </p>
    </div>
  `;
}
