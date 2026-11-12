// Vital Apex — comportamento da página. Sem dependências e sem requisições externas.
// O conteúdo e a navegação funcionam sem este arquivo; ele cuida do menu do celular,
// dos diálogos e do formulário demonstrativo.

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

/* Menu do celular */
const botaoMenu = $('.menu-botao');
const navegacao = $('#navegacao');

function definirMenu(aberto) {
  botaoMenu.setAttribute('aria-expanded', String(aberto));
  navegacao.classList.toggle('aberto', aberto);
}

botaoMenu.addEventListener('click', () => definirMenu(botaoMenu.getAttribute('aria-expanded') !== 'true'));
$$('a', navegacao).forEach(link => link.addEventListener('click', () => definirMenu(false)));
document.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && botaoMenu.getAttribute('aria-expanded') === 'true') {
    definirMenu(false);
    botaoMenu.focus();
  }
});
// Mesma consulta do CSS (css/base.css): ao sair do layout de celular, o menu volta ao estado fechado.
matchMedia('(max-width: 55em)').addEventListener('change', evento => { if (!evento.matches) definirMenu(false); });

/* Diálogos nativos: o navegador prende o foco, fecha com Escape e devolve o foco a quem abriu. */
const dialogos = {
  agendamento: $('#dlg-agendamento'),
  especialidade: $('#dlg-especialidade'),
  privacidade: $('#dlg-privacidade'),
};

// Quando o botão de origem está no menu e o menu está recolhido (ao abrir de dentro dele, ou se a
// janela encolher com o diálogo aberto), o navegador não tem para onde devolver o foco: o destino é
// o botão Menu. A decisão é tomada ao fechar, conforme o layout daquele momento.
// `origem` é o botão clicado: nem todo navegador foca o botão ao clicar com o mouse ou o toque.
let origemDoDialogo = null;

const visivel = elemento => elemento.getClientRects().length > 0 && getComputedStyle(elemento).visibility !== 'hidden';

function abrir(dialogo, origem = document.activeElement) {
  origemDoDialogo = origem;
  definirMenu(false);
  dialogo.showModal();
  document.body.classList.add('dialogo-aberto');
}

$$('dialog').forEach(dialogo => {
  $('[data-fechar]', dialogo).addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('close', () => {
    if ($('dialog[open]')) return;
    document.body.classList.remove('dialogo-aberto');
    // Quando este evento dispara, o foco ainda está no botão de fechar do diálogo (já oculto), não no corpo da página.
    if (origemDoDialogo && navegacao.contains(origemDoDialogo) && !visivel(origemDoDialogo) && visivel(botaoMenu)) botaoMenu.focus();
    origemDoDialogo = null;
  });
  // Clique no fundo (fora do painel) fecha.
  dialogo.addEventListener('click', evento => {
    if (evento.target !== dialogo) return;
    const caixa = dialogo.getBoundingClientRect();
    const dentro = evento.clientX >= caixa.left && evento.clientX <= caixa.right && evento.clientY >= caixa.top && evento.clientY <= caixa.bottom;
    if (!dentro) dialogo.close();
  });
});

/* Agendamento demonstrativo: não envia nada */
const form = $('#form-agendamento');
const resultado = $('#resultado-agendamento');
const campoEspecialidade = $('#campo-especialidade');
const campoPeriodo = $('#campo-periodo');

function abrirAgendamento(especialidade = '', origem = document.activeElement) {
  form.reset();
  form.hidden = false;
  resultado.hidden = true;
  resultado.replaceChildren();
  [campoEspecialidade, campoPeriodo].forEach(limparErro);
  campoEspecialidade.value = especialidade;
  abrir(dialogos.agendamento, origem);
}

function limparErro(campo) {
  campo.removeAttribute('aria-invalid');
  document.getElementById(campo.getAttribute('aria-describedby')).hidden = true;
}

function marcarErro(campo) {
  campo.setAttribute('aria-invalid', 'true');
  document.getElementById(campo.getAttribute('aria-describedby')).hidden = false;
}

[campoEspecialidade, campoPeriodo].forEach(campo => campo.addEventListener('change', () => limparErro(campo)));

form.addEventListener('submit', evento => {
  evento.preventDefault();
  const invalidos = [campoEspecialidade, campoPeriodo].filter(campo => !campo.value);
  [campoEspecialidade, campoPeriodo].forEach(limparErro);
  if (invalidos.length) {
    invalidos.forEach(marcarErro);
    invalidos[0].focus();
    return;
  }
  const titulo = document.createElement('strong');
  titulo.textContent = 'Prévia da solicitação';
  const escolha = document.createElement('p');
  escolha.textContent = `${campoEspecialidade.selectedOptions[0].textContent} · ${campoPeriodo.value}`;
  const aviso = document.createElement('p');
  aviso.textContent = 'Simulação concluída. Nenhuma solicitação foi enviada e nenhum horário foi reservado. Na versão final, você continuará pelo canal oficial de atendimento.';
  const recomecar = document.createElement('button');
  recomecar.type = 'button';
  recomecar.className = 'botao';
  recomecar.textContent = 'Simular outra escolha';
  recomecar.addEventListener('click', () => {
    form.hidden = false;
    resultado.hidden = true;
    campoEspecialidade.focus();
  });
  resultado.replaceChildren(titulo, escolha, aviso, recomecar);
  form.hidden = true;
  resultado.hidden = false;
  resultado.focus();
});

$$('[data-abrir="agendamento"]').forEach(botao => botao.addEventListener('click', () => abrirAgendamento('', botao)));
$$('[data-abrir="privacidade"]').forEach(botao => botao.addEventListener('click', () => abrir(dialogos.privacidade, botao)));

/* Detalhe da especialidade: o texto vive nos <template> do HTML */
$$('[data-especialidade]').forEach(botao => botao.addEventListener('click', () => {
  const chave = botao.dataset.especialidade;
  const modelo = document.getElementById(`tpl-${chave}`);
  $('#dlg-especialidade-titulo').textContent = modelo.dataset.titulo;
  $('#dlg-especialidade-texto').textContent = modelo.dataset.texto;
  $('#dlg-especialidade-pontos').replaceChildren(...modelo.content.cloneNode(true).children);
  dialogos.especialidade.dataset.especialidade = chave;
  abrir(dialogos.especialidade, botao);
}));

$('#dlg-especialidade-agendar').addEventListener('click', () => {
  const chave = dialogos.especialidade.dataset.especialidade;
  dialogos.especialidade.close();
  abrirAgendamento(chave, $('#dlg-especialidade-agendar'));
});

$('#ano').textContent = new Date().getFullYear();
