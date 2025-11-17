document.addEventListener("DOMContentLoaded", async () => {
  // ===================== Mensagem Dinâmica ======================
  const modal = document.getElementById("modalBoasVindas");
  const msg = document.getElementById("mensagemDinamica");
  const tituloSaudacao = document.getElementById("tituloSaudacao");

  const mensagens = [
    "Painel carregando com eficiência… 🚀",
    "Gestão moderna e inteligente! 📊",
    "Pronto para acelerar os resultados? 🏎️",
    "Experiência otimizada e profissional! ⚙️"
  ];

  function trocarMensagem() {
    if (!msg) return;
    msg.style.opacity = 0;
    setTimeout(() => {
      msg.textContent = mensagens[Math.floor(Math.random() * mensagens.length)];
      msg.style.opacity = 1;
    }, 300);
  }

  function gerarSaudacao() {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia ☀️";
    if (hora < 18) return "Boa tarde 🌤️";
    return "Boa noite 🌙";
  }

  // NOVA chave para garantir que o modal volte a aparecer
  const STORAGE_KEY = "modal_dashboard_v2";

  // Exibir modal se ainda não foi visto
  document.body.classList.add("modal-ativo");
tituloSaudacao.textContent = gerarSaudacao();
trocarMensagem();
setInterval(trocarMensagem, 3000);


  // Função global para o botão onclick="fecharModalPremium()"
  window.fecharModalPremium = function () {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.classList.remove("modal-ativo");
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => (modal.style.display = "none"), 400);
  };

  // ===================== MENU MOBILE =====================
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebarMenu");
  menuToggle?.addEventListener("click", () => sidebar.classList.toggle("active"));

  // ===================== TEMA ESCURO / CLARO =====================
 const themeToggle = document.getElementById("themeToggle");
  const body = document.body;
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    body.classList.add("light");
    themeToggle.innerHTML = `<i class="bi bi-brightness-high-fill"></i>`;
  }

  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light");
    const isLight = body.classList.contains("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.innerHTML = isLight
      ? `<i class="bi bi-brightness-high-fill"></i>`
      : `<i class="bi bi-moon-stars-fill"></i>`;
  });

  // ===================== DADOS (CARROS + CLIENTES) =====================
  let carros = [];
  let clientes = [];

  try {
    const [respCarros, respClientes] = await Promise.all([
      fetch("data/carros.json"),
      fetch("data/clientes.json")
    ]);

    if (!respCarros.ok || !respClientes.ok) {
      throw new Error("Erro ao carregar JSON");
    }

    carros = await respCarros.json();
    clientes = await respClientes.json();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    // Mesmo se der erro, o modal já funciona. Só evitamos quebrar o restante:
    return;
  }

  // ===================== KPIs =====================
  const totalVeiculos = carros.length;
  const disponiveis = carros.filter((c) => c.status === "Disponível").length;
  const vendidos = carros.filter((c) => c.status === "Vendido").length;
  const totalClientes = clientes.length;

  const elTotalVeiculos = document.getElementById("kpiTotalVeiculos");
  const elDisponiveis = document.getElementById("kpiDisponiveis");
  const elVendidos = document.getElementById("kpiVendidos");
  const elClientes = document.getElementById("kpiClientes");

  if (elTotalVeiculos) elTotalVeiculos.textContent = totalVeiculos;
  if (elDisponiveis) elDisponiveis.textContent = disponiveis;
  if (elVendidos) elVendidos.textContent = vendidos;
  if (elClientes) elClientes.textContent = totalClientes;

  // ===================== TABELAS - Últimos registros =====================
  const ultimosCarros = carros.slice(-5);
  const ultimosClientes = clientes.slice(-5);

  const tbodyV = document.getElementById("tabelaUltimosVeiculos");
  const tbodyC = document.getElementById("tabelaUltimosClientes");

  if (tbodyV) {
    ultimosCarros.forEach((c) => {
      tbodyV.innerHTML += `
        <tr>
          <td>${c.placa}</td>
          <td>${c.marca}</td>
          <td>${c.modelo}</td>
        </tr>
      `;
    });
  }

  if (tbodyC) {
    ultimosClientes.forEach((c) => {
      tbodyC.innerHTML += `
        <tr>
          <td>${c.nome}</td>
          <td>${c.cidade}</td>
        </tr>
      `;
    });
  }

  // ===================== GRÁFICO: Marcas =====================
  const ctxMarcas = document.getElementById("graficoMarcas");
  if (ctxMarcas) {
    const marcasCount = {};
    carros.forEach((c) => {
      marcasCount[c.marca] = (marcasCount[c.marca] || 0) + 1;
    });

    new Chart(ctxMarcas, {
      type: "bar",
      data: {
        labels: Object.keys(marcasCount),
        datasets: [
          {
            label: "Veículos por Marca",
            data: Object.values(marcasCount),
            backgroundColor: "#ff7b00"
          }
        ]
      },
      options: { responsive: true }
    });
  }

  // ===================== GRÁFICO: Status =====================
  const ctxStatus = document.getElementById("graficoStatus");
  if (ctxStatus) {
    const statusCount = {};
    carros.forEach((c) => {
      statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    });

    new Chart(ctxStatus, {
      type: "pie",
      data: {
        labels: Object.keys(statusCount),
        datasets: [
          {
            data: Object.values(statusCount),
            backgroundColor: ["#22c55e", "#ff7b00", "#6b7280"]
          }
        ]
      }
    });
  }

  // ===================== GRÁFICO: Clientes por Cidade =====================
  const ctxCidades = document.getElementById("graficoCidades");
  if (ctxCidades) {
    const cidadeCount = {};
    clientes.forEach((c) => {
      cidadeCount[c.cidade] = (cidadeCount[c.cidade] || 0) + 1;
    });

    new Chart(ctxCidades, {
      type: "doughnut",
      data: {
        labels: Object.keys(cidadeCount),
        datasets: [
          {
            data: Object.values(cidadeCount),
            backgroundColor: [
              "#ff7b00",
              "#2563eb",
              "#16a34a",
              "#dc2626",
              "#9333ea",
              "#0891b2",
              "#f97316",
              "#facc15"
            ]
          }
        ]
      }
    });
  }

  // ===================== GRÁFICO: Vendas (linha) =====================
  const ctxLinha = document.getElementById("graficoLinha");
  if (ctxLinha) {
    const vendasSimuladas = Array.from(
      { length: 12 },
      () => Math.floor(Math.random() * 20) + 5
    );

    new Chart(ctxLinha, {
      type: "line",
      data: {
        labels: [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez"
        ],
        datasets: [
          {
            label: "Vendas por Mês",
            data: vendasSimuladas,
            borderColor: "#ff7b00",
            backgroundColor: "rgba(255,123,0,0.3)",
            tension: 0.4,
            fill: true
          }
        ]
      }
    });
  }
});


