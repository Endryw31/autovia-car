document.addEventListener("DOMContentLoaded", async () => {
  const tabelaBody = document.querySelector("#tabelaVeiculos tbody");
  const filtro = document.getElementById("filtro");
  const modal = document.getElementById("modalVeiculo");
  const form = document.getElementById("formVeiculo");
  const modalTitulo = document.getElementById("modalTitulo");
  const fecharModal = document.getElementById("fecharModal");
  const cancelarModal = document.getElementById("cancelarModal");
  const novoBtn = document.getElementById("btnNovoVeiculo");

  // ========= MENU RESPONSIVO =========
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebarMenu");
  menuToggle?.addEventListener("click", () => sidebar.classList.toggle("active"));

  // ========= TEMA ESCURO/CLARO =========
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

  // ========= FETCH DO JSON =========
  let veiculos = [];
  try {
    const resposta = await fetch("data/carros.json");
    if (!resposta.ok) throw new Error("Erro ao carregar JSON");
    veiculos = await resposta.json();
    veiculos = veiculos.slice(0, 10);
    renderTabela(veiculos);
  } catch (e) {
    console.error("Erro ao carregar veículos:", e);
    tabelaBody.innerHTML = `<tr><td colspan="7" class="text-danger">Erro ao carregar os dados.</td></tr>`;
  }

  // ========= RENDERIZAR TABELA =========
  function renderTabela(lista) {
    tabelaBody.innerHTML = "";
    lista.forEach((v, i) => {
      const tr = document.createElement("tr");
      tr.dataset.index = i;

      tr.innerHTML = `
        <td class="cell-editable" data-field="placa">${v.placa}</td>
        <td>
          <img src="${v.foto}" alt="${v.modelo}" class="img-fluid rounded">
        </td>
        <td class="cell-editable" data-field="marca">${v.marca}</td>
        <td class="cell-editable" data-field="modelo">${v.modelo}</td>
        <td class="cell-editable" data-field="ano">${v.ano}</td>
        <td class="cell-editable" data-field="status">
          <span>${v.status}</span>
        </td>
        <td>
          <button class="btn-acao btn-edit" data-index="${i}" title="Editar via modal">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn-acao btn-del" data-index="${i}" title="Excluir">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      `;
      tabelaBody.appendChild(tr);
    });
  }

  // ========= FILTRO =========
  filtro.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtrados = veiculos.filter(v =>
      Object.values(v).some(val => String(val).toLowerCase().includes(q))
    );
    renderTabela(filtrados);
  });

  // ========= NOVO VEÍCULO (MODAL) =========
  novoBtn.addEventListener("click", () => {
    form.reset();
    form.dataset.index = "";
    modalTitulo.textContent = "Cadastrar Novo Veículo";
    modal.classList.add("ativo");
  });

  // ========= EDITAR / EXCLUIR (BOTÕES) =========
  tabelaBody.addEventListener("click", (e) => {
    const editar = e.target.closest(".btn-edit");
    const excluir = e.target.closest(".btn-del");

    if (excluir) {
      const idx = excluir.dataset.index;
      const confirmar = confirm("Deseja realmente excluir este veículo?");
      if (!confirmar) return;
      veiculos.splice(idx, 1);
      renderTabela(veiculos);
      return;
    }

    if (editar) {
      const idx = editar.dataset.index;
      const v = veiculos[idx];
      form.dataset.index = idx;
      form.placa.value = v.placa;
      form.marca.value = v.marca;
      form.modelo.value = v.modelo;
      form.ano.value = v.ano;
      form.status.value = v.status;
      form.foto.value = v.foto;
      modalTitulo.textContent = "Editar Veículo";
      modal.classList.add("ativo");
    }
  });

  // ========= EDIÇÃO INLINE COM 2 CLIQUES =========
  tabelaBody.addEventListener("dblclick", (e) => {
    const cell = e.target.closest(".cell-editable");
    if (!cell) return;

    const tr = cell.closest("tr");
    const idx = Number(tr.dataset.index);
    const field = cell.dataset.field;
    if (!field || idx < 0 || !veiculos[idx]) return;

    // não editar a coluna de foto por engano
    const valorAntigo = (cell.textContent || "").trim();

    // evita criar outro input em cima
    if (cell.querySelector("input")) return;

    const input = document.createElement("input");
    input.type = field === "ano" ? "number" : "text";
    input.value = valorAntigo;
    input.className = "inline-input";

    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();
    input.select();

    const salvar = () => {
      let novoValor = input.value.trim();
      if (!novoValor) {
        cell.textContent = valorAntigo;
        return;
      }

      if (field === "ano") {
        const num = Number(novoValor);
        if (!Number.isNaN(num)) {
          veiculos[idx][field] = num;
        } else {
          veiculos[idx][field] = veiculos[idx][field];
        }
      } else {
        veiculos[idx][field] = novoValor;
      }

      renderTabela(veiculos);
    };

    input.addEventListener("blur", salvar);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") salvar();
      if (ev.key === "Escape") {
        cell.textContent = valorAntigo;
      }
    });
  });

  // ========= SALVAR (MODAL) =========
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const novo = {
      placa: form.placa.value.trim(),
      marca: form.marca.value.trim(),
      modelo: form.modelo.value.trim(),
      ano: Number(form.ano.value),
      status: form.status.value,
      foto: form.foto.value.trim() || "img/default.png"
    };
    const idx = form.dataset.index;
    if (idx !== "" && idx != null) veiculos[idx] = novo;
    else veiculos.push(novo);
    renderTabela(veiculos);
    modal.classList.remove("ativo");
  });

  [fecharModal, cancelarModal].forEach(btn =>
    btn.addEventListener("click", () => modal.classList.remove("ativo"))
  );

  // ========= EXPORTAR EXCEL =========
  document.getElementById("btnExportCsv").addEventListener("click", () => {
    const linhas = [["Placa", "Marca", "Modelo", "Ano", "Status"],
      ...veiculos.map(v => [v.placa, v.marca, v.modelo, v.ano, v.status])];
    const csv = linhas.map(l => l.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "veiculos_autovia.xlsx";
    link.click();
  });

  // ========= EXPORTAR PDF =========
  document.getElementById("btnExportPdf").addEventListener("click", () => {
    document.querySelector(".header-actions").style.opacity = "0";
    setTimeout(() => {
      window.print();
      document.querySelector(".header-actions").style.opacity = "1";
    }, 200);
  });

  // ========= AUTOCOMPLETE DE MARCA E MODELO =========
  const marcasMaisVendidas = [
    "Toyota","Volkswagen","Ford","Honda","Chevrolet",
    "Hyundai","Nissan","Jeep","Fiat","Renault"
  ];

  const modelosMaisVendidos = [
    "Corolla","Civic","Onix","HB20","Ranger",
    "Gol","Compass","Kicks","Argo","Duster"
  ];

  const marcaInput = form.marca;
  const modeloInput = form.modelo;

  // Cria datalist dinamicamente
  const datalistMarca = document.createElement("datalist");
  datalistMarca.id = "listaMarcas";
  marcasMaisVendidas.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    datalistMarca.appendChild(opt);
  });
  marcaInput.setAttribute("list", "listaMarcas");
  document.body.appendChild(datalistMarca);

  const datalistModelo = document.createElement("datalist");
  datalistModelo.id = "listaModelos";
  modelosMaisVendidos.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    datalistModelo.appendChild(opt);
  });
  modeloInput.setAttribute("list", "listaModelos");
  document.body.appendChild(datalistModelo);
});
