document.addEventListener("DOMContentLoaded", async () => {
  const tabelaBody = document.querySelector("#tabelaClientes tbody");
  const filtro = document.getElementById("filtro");
  const modal = document.getElementById("modalCliente");
  const form = document.getElementById("formCliente");
  const modalTitulo = document.getElementById("modalTitulo");
  const fecharModal = document.getElementById("fecharModal");
  const cancelarModal = document.getElementById("cancelarModal");
  const novoBtn = document.getElementById("btnNovoCliente");

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
  let clientes = [];
  try {
    const resposta = await fetch("data/clientes.json");
    if (!resposta.ok) throw new Error("Erro ao carregar JSON");
    clientes = await resposta.json();
    // se quiser limitar a 10:
    // clientes = clientes.slice(0, 10);
    renderTabela(clientes);
  } catch (e) {
    console.error("Erro ao carregar clientes:", e);
    tabelaBody.innerHTML = `<tr><td colspan="7" class="text-danger">Erro ao carregar os dados.</td></tr>`;
  }

  // ========= RENDERIZAR TABELA (estilo cards Notion/Monday) =========
  function renderTabela(lista) {
    tabelaBody.innerHTML = "";
    lista.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.dataset.index = i;
      tr.innerHTML = `
        <td class="cell-editable">${c.id}</td>
        <td class="cell-editable">${c.nome}</td>
        <td class="cell-editable">${c.email}</td>
        <td class="cell-editable">${c.telefone}</td>
        <td class="cell-editable">${c.cidade}</td>
        <td>
          <span class="status-pill status-${(c.status || "Ativo").toLowerCase().replace(" ", "-")}">
            ${c.status || "Ativo"}
          </span>
        </td>
        <td class="acoes-col">
          <button class="btn-acao btn-edit btn-sm btn-warning" data-index="${i}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-acao btn-del btn-sm btn-danger" data-index="${i}" title="Excluir">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tabelaBody.appendChild(tr);
    });
  }

  // ========= FILTRO =========
  if (filtro) {
    filtro.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtrados = clientes.filter(c =>
        Object.values(c).some(val =>
          String(val ?? "").toLowerCase().includes(q)
        )
      );
      renderTabela(filtrados);
    });
  }

  // ========= NOVO Cliente =========
  novoBtn.addEventListener("click", () => {
    form.reset();
    form.dataset.index = "";
    modalTitulo.textContent = "Cadastrar Novo Cliente";
    modal.classList.add("ativo");
  });

  // ========= EDITAR / EXCLUIR (botões) =========
  tabelaBody.addEventListener("click", (e) => {
    const btnEditar = e.target.closest(".btn-edit");
    const btnExcluir = e.target.closest(".btn-del");

    if (btnExcluir) {
      const idx = btnExcluir.dataset.index;
      const confirmar = confirm("Deseja realmente excluir este cliente?");
      if (!confirmar) return;
      clientes.splice(idx, 1);
      renderTabela(clientes);
      return;
    }

    if (btnEditar) {
      const idx = btnEditar.dataset.index;
      const c = clientes[idx];

      form.dataset.index = idx;
      form.id.value = c.id;
      form.nome.value = c.nome;
      form.email.value = c.email;
      form.telefone.value = c.telefone;
      form.cidade.value = c.cidade;
      form.status.value = c.status || "Ativo";

      modalTitulo.textContent = "Editar Cliente";
      modal.classList.add("ativo");
    }
  });

  // ========= EDIÇÃO POR DUPLO CLIQUE (inline) =========
  tabelaBody.addEventListener("dblclick", (e) => {
    const td = e.target.closest("td");
    if (!td) return;

    // não editar coluna de ações
    const colIndex = td.cellIndex;
    // colunas: 0=id,1=nome,2=email,3=telefone,4=cidade
    if (colIndex > 4) return;

    const tr = td.parentElement;
    const idx = tr.dataset.index;
    if (idx === undefined) return;

    const campos = ["id", "nome", "email", "telefone", "cidade"];
    const campo = campos[colIndex];

    // já está em modo edição?
    if (td.classList.contains("cell-editing")) return;

    const valorAtual = td.textContent.trim();
    td.classList.add("cell-editing");
    td.innerHTML = "";

    const input = document.createElement("input");
    input.type = "text";
    input.value = valorAtual;
    input.className = "inline-input";
    td.appendChild(input);
    input.focus();
    input.select();

    const salvar = () => {
      const novoValor = input.value.trim();
      clientes[idx][campo] = novoValor;
      td.classList.remove("cell-editing");
      td.textContent = novoValor || "-";
    };

    input.addEventListener("blur", salvar);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        input.blur();
      }
      if (ev.key === "Escape") {
        td.classList.remove("cell-editing");
        td.textContent = valorAtual;
      }
    });
  });

  // ========= SALVAR (via modal) =========
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const novo = {
      id: form.id.value.trim(),
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
      cidade: form.cidade.value.trim(),
      status: form.status.value || "Ativo",
    };

    const idx = form.dataset.index;
    if (idx !== "" && idx !== undefined) {
      clientes[idx] = novo;
    } else {
      clientes.push(novo);
    }

    renderTabela(clientes);
    modal.classList.remove("ativo");
  });

  [fecharModal, cancelarModal].forEach(btn =>
    btn.addEventListener("click", () => modal.classList.remove("ativo"))
  );

  // ========= EXPORTAR EXCEL =========
  document.getElementById("btnExportCsv").addEventListener("click", () => {
    const linhas = [
      ["ID", "Nome", "Email", "Telefone", "Cidade", "Status"],
      ...clientes.map(c => [c.id, c.nome, c.email, c.telefone, c.cidade, c.status || "Ativo"])
    ];
    const csv = linhas.map(l => l.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "clientes_autovia.csv";
    link.click();
  });

  // ========= EXPORTAR PDF =========
  document.getElementById("btnExportPdf").addEventListener("click", () => {
    const headerActions = document.querySelector(".header-actions");
    if (headerActions) headerActions.style.opacity = "0";

    setTimeout(() => {
      window.print();
      if (headerActions) headerActions.style.opacity = "1";
    }, 200);
  });
});
