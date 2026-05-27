// ==========================================
// CONFIGURAÇÃO DA API (GOOGLE APPS SCRIPT)
// ==========================================
// Alunos: Colem a URL do seu Web App (Apps Script) gerado no Google Sheets aqui:
const API_URL = "SUA_URL_DO_APPS_SCRIPT_AQUI"; 

// Elementos da UI (Modal)
const modal = document.getElementById('agendamento-modal');
const btnAbrirAgenda = document.getElementById('btn-abrir-agenda');
const btnFecharModal = document.getElementById('close-modal');
const formAgendamento = document.getElementById('form-agendamento');
const selectServico = document.getElementById('servico-escolhido');
const selectProfissional = document.getElementById('profissional-escolhido');
const inputData = document.getElementById('data-escolhida');
const containerHorarios = document.getElementById('horarios-container');
const inputHorarioOculto = document.getElementById('horario-selecionado');
const btnConfirmar = document.getElementById('btn-confirmar');
const statusMsg = document.getElementById('agendamento-status');

// Eventos de Abrir/Fechar Modal
btnAbrirAgenda.addEventListener('click', () => {
    modal.classList.remove('hidden');
    carregarDadosIniciais(); // Busca profs e servicos ao abrir
});

btnFecharModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Fecha modal clicando fora
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// ==========================================
// FUNÇÕES DE COMUNICAÇÃO COM O BANCO (SHEETS)
// ==========================================

// 1. Buscar Profissionais e Serviços
async function carregarDadosIniciais() {
    if (API_URL === "SUA_URL_DO_APPS_SCRIPT_AQUI") {
        statusMsg.textContent = "Atenção: Configure a API_URL no agenda.js!";
        statusMsg.className = "status-msg erro";
        return;
    }

    try {
        // Carrega profissionais
        const resProf = await fetch(`${API_URL}?acao=profissionais`);
        const profissionais = await resProf.json();
        
        selectProfissional.innerHTML = '<option value="">Selecione...</option>';
        profissionais.forEach(p => {
            selectProfissional.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
        });

        // Carrega serviços
        const resServ = await fetch(`${API_URL}?acao=servicos`);
        const servicos = await resServ.json();
        
        selectServico.innerHTML = '<option value="">Selecione...</option>';
        servicos.forEach(s => {
            selectServico.innerHTML += `<option value="${s.nome}">${s.nome} (R$ ${s.preco})</option>`;
        });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        selectProfissional.innerHTML = '<option value="">Erro ao carregar</option>';
        selectServico.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// 2. Buscar Horários Livres
async function buscarHorariosLivres() {
    const profissional = selectProfissional.value;
    const data = inputData.value;

    if (!profissional || !data) return;

    containerHorarios.innerHTML = '<p class="horarios-aviso">Buscando horários...</p>';
    btnConfirmar.disabled = true;
    inputHorarioOculto.value = '';

    try {
        const resHorarios = await fetch(`${API_URL}?acao=horarios&profissional=${profissional}&data=${data}`);
        const horarios = await resHorarios.json();

        containerHorarios.innerHTML = '';
        if (horarios.length === 0) {
            containerHorarios.innerHTML = '<p class="horarios-aviso">Nenhum horário livre neste dia.</p>';
            return;
        }

        horarios.forEach(hora => {
            const btn = document.createElement('div');
            btn.classList.add('horario-btn');
            btn.textContent = hora;
            
            btn.addEventListener('click', () => {
                // Remove seleção dos outros
                document.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selecionado'));
                // Seleciona este
                btn.classList.add('selecionado');
                inputHorarioOculto.value = hora;
                btnConfirmar.disabled = false;
            });
            
            containerHorarios.appendChild(btn);
        });

    } catch (erro) {
        console.error("Erro ao buscar horários:", erro);
        containerHorarios.innerHTML = '<p class="horarios-aviso" style="color:red">Erro ao buscar horários.</p>';
    }
}

// Escuta mudanças na data ou profissional para recarregar horários
selectProfissional.addEventListener('change', buscarHorariosLivres);
inputData.addEventListener('change', buscarHorariosLivres);

// 3. Salvar o Agendamento
formAgendamento.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        nome: document.getElementById('nome-cliente').value,
        telefone: document.getElementById('telefone-cliente').value,
        email: document.getElementById('email-cliente').value,
        servico: selectServico.value,
        profissional: selectProfissional.value,
        data: inputData.value,
        hora: inputHorarioOculto.value
    };

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Agendando...";
    statusMsg.textContent = "";
    statusMsg.className = "status-msg";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        
        const resultado = await response.json();

        if (resultado.sucesso) {
            statusMsg.textContent = "Agendamento confirmado com sucesso!";
            statusMsg.className = "status-msg sucesso";
            formAgendamento.reset();
            containerHorarios.innerHTML = '<p class="horarios-aviso">Selecione o profissional e a data para ver os horários.</p>';
            
            // Avisar ao chatbot sobre o agendamento bem sucedido (opcional)
            setTimeout(() => {
                modal.classList.add('hidden');
                statusMsg.textContent = "";
            }, 3000);
        } else {
            throw new Error("Erro desconhecido ao salvar");
        }
    } catch (erro) {
        console.error("Erro ao agendar:", erro);
        statusMsg.textContent = "Erro ao tentar agendar. Verifique o console.";
        statusMsg.className = "status-msg erro";
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = "Confirmar Agendamento";
    }
});
