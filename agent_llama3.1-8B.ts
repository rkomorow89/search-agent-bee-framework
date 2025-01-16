import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { DuckDuckGoSearchTool } from "bee-agent-framework/tools/search/duckDuckGoSearch";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

// Bestimme das aktuelle Verzeichnis
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lese den Prompt und die Anzahl der Quellen aus den Kommandozeilenargumenten
const prompt = process.argv[2] || "Finde Informationen über KI in Bezug auf Nachhaltigkeit";
const maxResults = parseInt(process.argv[3]) || 5;  // Standardwert auf 5 setzen, wenn keine Zahl angegeben

console.log(`Prompt: "${prompt}"`);
console.log(`Maximale Quellenanzahl: ${maxResults}`);

const llm = new OllamaChatLLM();   // Standardmodell ist llama3.1 (8B), empfohlen wird das 70B Modell
const searchTool = new DuckDuckGoSearchTool({ maxResults }); // Setze die Anzahl der maximalen Ergebnisse auf die angegebene Zahl

const agent = new BeeAgent({
  llm,
  memory: new TokenMemory({ llm }),
  tools: [searchTool],
});

// Lösche die beiden JSON-Dateien, falls sie existieren
const dir = join(__dirname, '..', 'responses');
const filePath = join(dir, 'agent_thoughts.json');
const urlsFilePath = join(dir, 'found_urls.json');

if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);  // Lösche agent_thoughts.json
}

if (fs.existsSync(urlsFilePath)) {
  fs.unlinkSync(urlsFilePath);  // Lösche found_urls.json
}

console.log("Agent gestartet...");

const response = await agent
  .run({ prompt })
  .observe((emitter) => {
    emitter.on("update", async ({ data, update, meta }) => {
      console.log(`Agent (${update.key}) 🤖 : `, update.value);

      // Stelle sicher, dass das Verzeichnis existiert
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      // Bereite die zu schreibenden Daten vor
      const logEntry = {
        timestamp: new Date().toISOString(),
        key: update.key,
        value: update.value,
      };

      // Lese die bestehenden Daten und füge den neuen Eintrag hinzu
      let existingData = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        existingData = JSON.parse(fileContent);
      }
      existingData.push(logEntry);

      // Schreibe die aktualisierte Datei sofort
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

      // Extrahiere und speichere die gefundenen URLs  
      const urls = (update.value.match(/https?:\/\/\S+/g) || [])
        .map(url => url.replace(/\\+/g, '').replace(/\"+/g, '')) // Entferne Escape-Zeichen und doppelte Anführungszeichen
        .filter(url => url); // Filtere leere Werte

      let existingUrls = [];
      if (fs.existsSync(urlsFilePath)) {
        const fileContent = fs.readFileSync(urlsFilePath, 'utf-8');
        existingUrls = JSON.parse(fileContent);
      }

      // Verwende ein Set, um Duplikate zu vermeiden und die URLs zu aktualisieren
      const uniqueUrls = new Set([...existingUrls, ...urls]);

      // Schreibe die URLs ohne Duplikate in die Datei
      fs.writeFileSync(urlsFilePath, JSON.stringify(Array.from(uniqueUrls), null, 2));
    });
  });

console.log(`Agent 🤖 : `, response.result.text);  // Loggen der letzten Antwort des Agenten
