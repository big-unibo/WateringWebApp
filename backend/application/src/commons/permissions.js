import fs from 'fs';
import { RAW_PERMISSIONS } from "./permissionsDef.js";

const generateDocText = (rule) => {
    if (rule.customDoc) return rule.customDoc;

    const idRequirement = rule.target
        ? `- **Target:** Richiede match su id di \`${rule.target}\``
        : `- **Target:** Globale (Nessun ID specifico richiesto)`;

    return `
* **Tabella:** \`${rule.table}\`
* **Permesso:** \`${rule.permit}\`
${idRequirement}`;
};

const processSingleRule = (key, ruleData) => {
    return {
        checks: [ruleData],
        placeholder: `%PERM_${key}%`,
        docText: `
### Autorizzazione Richiesta
${generateDocText(ruleData)}
`
    };
};

const processMultiRule = (key, rulesArray) => {
    const combinedDocs = rulesArray
        .map(rule => `#### ➤ Requisito\n${generateDocText(rule)}`)
        .join('\n');

    return {
        checks: rulesArray,
        docText: `
### Autorizzazioni Multiple Richieste
Per questa operazione sono necessari **tutti** i seguenti permessi:
${combinedDocs}
`
    };
};

const buildPermissions = (definitions) => {
    const processed = {};

    for (const [key, value] of Object.entries(definitions)) {
        if (Array.isArray(value)) {
            processed[key] = processMultiRule(key, value);
        } else {
            processed[key] = processSingleRule(key, value);
        }
    }
    return processed;
};

export const PERMISSIONS = buildPermissions(RAW_PERMISSIONS);

/**
 * Genera un file .md con tutti i permessi del sistema.
 * @param {string} filePath - Il percorso dove salvare il file (default: ./PERMISSIONS_DOC.md)
 */
export const savePermissionsToMarkdown = (filePath = './doc/PERMISSIONS_DOC.md') => {
    const generationDate = new Date().toISOString().split('T')[0];
    let mdContent = `# 🔐 System Permissions Reference\n`;
    mdContent += `> **Generato automaticamente il:** ${generationDate}\n\n`;
    mdContent += `Questo documento elenca tutte le regole di autorizzazione definite nel sistema.\n\n`;

    mdContent += `## 📋 Indice Rapido\n\n`;
    mdContent += `| Chiave Permesso | Tipo | Tabelle Coinvolte |\n`;
    mdContent += `|---|---|---|\n`;

    Object.entries(PERMISSIONS).forEach(([key, rule]) => {
        const type = rule.checks.length > 1 ? 'Multiplo 🔗' : 'Singolo 👤';
        const tables = [...new Set(rule.checks.map(c => `\`${c.table}\``))].join(', ');
        
        mdContent += `| **${key}** | ${type} | ${tables} |\n`;
    });

    mdContent += `\n---\n`;

    mdContent += `## 🔎 Dettaglio Regole\n`;

    Object.entries(PERMISSIONS).forEach(([key, rule]) => {
        mdContent += `\n### 🔑 ${key}\n`;

        mdContent += rule.docText;
        
        mdContent += `\n\n---\n`;
    });

    try {
        fs.writeFileSync(filePath, mdContent, 'utf8');
        console.log(`File di documentazione permessi creato: ${filePath}`);
    } catch (error) {
        console.error(`Errore nella creazione del file MD: ${error.message}`);
    }
};