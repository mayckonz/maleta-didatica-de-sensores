import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUlByD4xg7CttpIzThoefEiW33ITOTaEU",
  authDomain: "maleta-didatica-de-sensores.firebaseapp.com",
  databaseURL: "https://maleta-didatica-de-sensores-default-rtdb.firebaseio.com/",
  projectId: "maleta-didatica-de-sensores",
  storageBucket: "maleta-didatica-de-sensores.firebasestorage.app",
  messagingSenderId: "67634453347",
  appId: "1:67634453347:web:653acea0b2cf3d262d1156"
};

const TEMPO_LIMITE_MS = 15000; // sem dados por 15 s => "Sem sinal"
let ultimoRecebimento = 0;

const statusEl = document.getElementById("status");
const ultimaEl = document.getElementById("ultima");

// Lê "cor.r" dentro do objeto de dados
function pegar(dados, caminho) {
  return caminho.split(".").reduce((o, k) => (o ? o[k] : undefined), dados);
}

function atualizarTela(dados) {
  document.querySelectorAll("[data-campo]").forEach((el) => {
    const v = pegar(dados, el.dataset.campo);
    el.textContent = v === undefined || v === null ? "--" : v;
  });

  const { cor, luz, som } = dados;
  if (cor) {
    document.getElementById("amostraCor").style.background = `rgb(${cor.r}, ${cor.g}, ${cor.b})`;
  }
  if (luz !== undefined) document.getElementById("barraLuz").style.width = `${(luz / 4095) * 100}%`;
  if (som !== undefined) document.getElementById("barraSom").style.width = `${(som / 4095) * 100}%`;

  ultimoRecebimento = Date.now();
  ultimaEl.textContent = "Última atualização: " + new Date().toLocaleTimeString("pt-BR");
  definirStatus(true);
}

function definirStatus(online) {
  statusEl.textContent = online ? "Recebendo dados" : "Sem sinal";
  statusEl.className = "status " + (online ? "on" : "off");
}

// Verifica a cada segundo se os dados pararam de chegar
setInterval(() => {
  if (ultimoRecebimento && Date.now() - ultimoRecebimento > TEMPO_LIMITE_MS) definirStatus(false);
}, 1000);

// 2) Escuta em tempo real o nó /maleta
try {
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  onValue(
    ref(db, "maleta"),
    (snapshot) => {
      const dados = snapshot.val();
      if (dados) atualizarTela(dados);
    },
    (erro) => {
      console.error("Erro Firebase:", erro);
      statusEl.textContent = "Erro de conexão";
    }
  );
} catch (e) {
  console.error("Firebase não configurado:", e);
}

// 3) Simulador: testa o layout sem ESP32 e sem Firebase
const aleatorio = (min, max) => Math.round(min + Math.random() * (max - min));
document.getElementById("btnSimular").addEventListener("click", () => {
  atualizarTela({
    velocidade_rpm: aleatorio(0, 3000),
    peso_g: aleatorio(0, 50000),
    temperatura: aleatorio(20, 35),
    umidade: aleatorio(30, 80),
    luz: aleatorio(0, 4095),
    distancia_cm: aleatorio(2, 200),
    cor: { r: aleatorio(0, 255), g: aleatorio(0, 255), b: aleatorio(0, 255) },
    bpm: aleatorio(60, 100),
    som: aleatorio(0, 4095)
  });
});
