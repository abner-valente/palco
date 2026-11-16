// Textos da interface, separados do codigo.
//
// Por que este arquivo existe: antes, cada frase estava escrita no meio do
// HTML e do JS. Traduzir significava mexer em codigo. Agora traduzir e
// preencher um dicionario — qualquer pessoa consegue, sem risco de quebrar
// nada.
//
// Como usar:
//   no JS .... t("auth.entrar")
//   no HTML .. <button data-i18n="auth.entrar">Entrar</button>
//
// As chaves sao planas e com ponto ("auth.entrar") de proposito: fica facil
// procurar uma frase com grep e facil mandar a lista para um tradutor.
//
// ATENCAO: "es" e "en" estao vazios de proposito nesta etapa. Enquanto
// estiverem assim, qualquer chave cai no portugues (ver a funcao t). O site
// continua 100% em portugues. Preencher os dois e a etapa seguinte, e nao
// mexe em codigo nenhum — so neste arquivo.

export const IDIOMAS = ["pt", "es", "en"]
export const IDIOMA_PADRAO = "pt"

// Codigo do idioma para o atributo lang do <html> e para formatar datas.
export const LOCALE_HTML = { pt: "pt-BR", es: "es-ES", en: "en-US" }

const pt = {
  // ── Geral ──
  "meta.tituloPagina": "Palco de Papéis",
  "comum.carregando": "Carregando...",
  "comum.sair": "Sair",
  "comum.precisaAjuda": "Precisa de ajuda? Entre em contato",
  "comum.emailCopiado": "Email copiado!",

  // ── Login / cadastro ──
  "auth.entrar": "Entrar",
  "auth.criarConta": "Criar conta",
  "auth.entrarNoPalco": "Entrar no Palco",
  "auth.email": "Usuário / Email",
  "auth.senha": "Senha",
  "auth.confirmarSenha": "Confirmar senha",
  "auth.esqueceuSenha": "Esqueceu a senha?",
  "auth.semConta": "Não tem conta? Criar uma",
  "auth.temConta": "Já tem conta? Entrar",
  "auth.entrando": "Entrando...",
  "auth.criandoConta": "Criando conta...",
  "auth.senhasNaoCoincidem": "As senhas não coincidem.",
  "auth.emailJaTemConta":
    'Este email já possui uma conta. Entre com sua senha ou use "Esqueceu a senha?" para recuperar o acesso.',
  "auth.digiteEmailPrimeiro": "Digite seu email no campo acima primeiro.",
  "auth.emailResetEnviado":
    "Email enviado. Verifique sua caixa de entrada para redefinir a senha.",

  // ── Confirmar email ──
  "confirmar.titulo": "Confirme seu email",
  "confirmar.naoRecebeu": "Não recebeu? Verifique a pasta de spam ou reenvie abaixo.",
  "confirmar.reenviar": "Reenviar email",
  "confirmar.enviando": "Enviando...",
  "confirmar.voltarLogin": "Voltar ao login",
  "confirmar.reenviado": "Email reenviado. Verifique sua caixa de entrada.",
  "confirmar.linkEnviado":
    "Enviamos um link de confirmação para {email}. Clique no link para ativar sua conta e então volte aqui para entrar.",

  // ── Redefinir senha ──
  "reset.titulo": "Redefinir senha",
  "reset.novaSenha": "Nova senha",
  "reset.confirmarNovaSenha": "Confirmar nova senha",
  "reset.salvar": "Salvar nova senha",

  // ── Conta suspensa ──
  "bloqueado.titulo": "Conta suspensa",
  "bloqueado.mensagem":
    "Sua conta foi suspensa. Entre em contato com o suporte para mais informações.",

  // ── Paywall ──
  "paywall.padrao": "Sua conta ainda não tem uma assinatura ativa.",
  "paywall.pastDue":
    "Nao conseguimos confirmar o pagamento da sua assinatura. Atualize a forma de pagamento para voltar a usar o Palco.",
  "paywall.unpaid":
    "Sua assinatura esta com uma fatura em aberto. Regularize o pagamento para voltar a usar o Palco.",
  "paywall.incomplete":
    "O pagamento da sua assinatura ainda nao foi confirmado. Conclua o pagamento para liberar o acesso.",
  "paywall.incompleteExpired":
    "O pagamento da sua assinatura nao foi concluido a tempo. Faca uma nova assinatura para voltar a usar o Palco.",
  "paywall.canceled": "Sua assinatura foi cancelada. Esperamos te ver de volta em breve!",
  "paywall.assinarAgora": "Assinar agora",
  "paywall.regularizarPagamento": "Regularizar pagamento",
  "paywall.redirecionando": "Redirecionando...",

  // ── Perfil ──
  "perfil.titulo": "Meu Perfil",
  "perfil.email": "Email",
  "perfil.trocarSenha": "Trocar senha",
  "perfil.novaSenha": "Nova Senha",
  "perfil.confirmarNovaSenha": "Confirmar nova senha",
  "perfil.atualizarSenha": "Atualizar senha",
  "perfil.senhaAtualizada": "Senha atualizada com sucesso.",
  "perfil.assinatura": "Assinatura",
  "perfil.status": "Status",
  "perfil.proximaRenovacao": "Próxima renovação",
  "perfil.gerenciarStripe": "Gerenciar assinatura no Stripe",
  "perfil.gerenciarAssinatura": "Gerenciar assinatura",
  "perfil.abrindo": "Abrindo...",
  "perfil.voltarPalco": "Voltar ao palco",
  "perfil.semAssinatura": "Sem assinatura",
  "perfil.statusAtiva": "Ativa",
  "perfil.statusVencida": "Vencida",
  "perfil.statusCancelada": "Cancelada",
  "perfil.statusInativa": "Inativa",

  // ── Menu lateral ──
  "menu.abrir": "Abrir menu",
  "menu.fechar": "Fechar menu",
  "menu.meuPerfil": "MEU PERFIL",
  "menu.salvar": "SALVAR (.json)",
  "menu.carregar": "CARREGAR (.json)",
  "menu.suporte": "SUPORTE",
  "menu.sair": "SAIR",

  // ── Palco ──
  "palco.lixeira": "Arraste um item aqui para remover",
  "palco.arquivoInvalido": "Arquivo de sessao invalido.",

  // ── Rodape ──
  "rodape.contatos": "CONTATOS",
  "rodape.suporte": "SUPORTE",

  // ── Mensagens de erro ──
  "erro.credenciaisInvalidas": "Email ou senha incorretos.",
  "erro.emailNaoConfirmado":
    "Confirme seu email antes de entrar. Verifique sua caixa de entrada.",
  "erro.jaRegistrado": "Este email já possui uma conta. Tente entrar ou recuperar a senha.",
  "erro.senhaCurta": "A senha precisa ter pelo menos 6 caracteres.",
  "erro.emailInvalido": "O formato do email parece inválido. Verifique e tente novamente.",
  "erro.muitasTentativas": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "erro.sessaoExpirou": "Sua sessão expirou. Faça login novamente.",
  "erro.problemaConexao": "Problema de conexão. Verifique sua internet e tente novamente.",
  "erro.timeout": "O servidor demorou para responder. Tente novamente em instantes.",
  "erro.mesmaSenha": "A nova senha não pode ser igual à senha atual.",
  "erro.portalFalhou": "Não foi possível abrir o portal de assinatura. Tente novamente.",
  "erro.checkoutFalhou": "Não foi possível iniciar o pagamento. Tente novamente.",
  "erro.generico": "Algo deu errado. Tente novamente ou entre em contato com o suporte.",
}

// Espanhol e ingles: preencher com as mesmas chaves do objeto pt acima.
// Chave ausente ou string vazia cai automaticamente no portugues, entao da
// para traduzir aos poucos sem deixar o site num estado quebrado.
const es = {}
const en = {}

const DICIONARIOS = { pt, es, en }

let idioma = IDIOMA_PADRAO

/** Idioma em uso agora. */
export function idiomaAtual() {
  return idioma
}

/**
 * Traduz uma chave. Interpola {nome} com os valores passados em vars.
 * Se o idioma atual nao tiver a chave, cai no portugues; se nem o portugues
 * tiver, devolve a propria chave (fica visivel na tela e e facil de achar).
 */
export function t(chave, vars) {
  const texto = DICIONARIOS[idioma]?.[chave] || pt[chave] || chave
  if (!vars) return texto
  return texto.replace(/\{(\w+)\}/g, (_, nome) => (nome in vars ? vars[nome] : `{${nome}}`))
}

/**
 * Define o texto de um elemento e grava nele a chave usada.
 *
 * Existe porque varios botoes mudam de texto em tempo de execucao: o botao
 * de entrar vira "Criar conta", a mensagem do paywall muda conforme o status
 * da assinatura. Sem gravar a chave, trocar o idioma faria traduzirDom
 * reescrever esses elementos com a chave original do HTML — o botao voltaria
 * a dizer "Entrar" no meio de um cadastro.
 */
export function setTexto(el, chave, vars) {
  if (!el) return
  el.dataset.i18n = chave
  if (vars) el.dataset.i18nVars = JSON.stringify(vars)
  else delete el.dataset.i18nVars
  el.textContent = t(chave, vars)
}

/**
 * Aplica as traducoes aos elementos marcados dentro de raiz.
 * Chamar depois de injetar HTML novo na pagina e depois de trocar o idioma.
 *
 *   data-i18n             -> textContent
 *   data-i18n-vars        -> JSON com os valores a interpolar (opcional)
 *   data-i18n-placeholder -> placeholder
 *   data-i18n-title       -> title
 *   data-i18n-aria        -> aria-label
 */
export function traduzirDom(raiz = document) {
  raiz.querySelectorAll("[data-i18n]").forEach((el) => {
    let vars
    if (el.dataset.i18nVars) {
      try {
        vars = JSON.parse(el.dataset.i18nVars)
      } catch {
        // Atributo corrompido: traduz sem interpolar em vez de quebrar a tela.
      }
    }
    el.textContent = t(el.dataset.i18n, vars)
  })
  raiz.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder)
  })
  raiz.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle)
  })
  raiz.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria))
  })
}

/**
 * Troca o idioma: guarda a escolha, atualiza o lang do <html>, o titulo da
 * aba e todos os textos marcados que estiverem na pagina.
 */
export function definirIdioma(codigo) {
  if (!IDIOMAS.includes(codigo)) return
  idioma = codigo
  try {
    localStorage.setItem("palco.idioma", codigo)
  } catch {
    // Navegador em modo privado pode recusar o localStorage. A escolha vale
    // so para esta visita, o que e melhor do que quebrar a troca de idioma.
  }
  document.documentElement.lang = LOCALE_HTML[codigo]
  document.title = t("meta.tituloPagina")
  traduzirDom()
}

/**
 * Descobre o idioma da primeira visita: o que a pessoa escolheu antes; se
 * nunca escolheu, o idioma do navegador; se nao for um que temos, portugues.
 */
export function detectarIdioma() {
  try {
    const salvo = localStorage.getItem("palco.idioma")
    if (salvo && IDIOMAS.includes(salvo)) return salvo
  } catch {
    // Sem localStorage seguimos para a deteccao pelo navegador.
  }
  const doNavegador = (navigator.language || "").slice(0, 2).toLowerCase()
  return IDIOMAS.includes(doNavegador) ? doNavegador : IDIOMA_PADRAO
}
