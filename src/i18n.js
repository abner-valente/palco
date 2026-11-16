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

// Codigo aceito pelo Stripe nas telas de pagamento e no portal. Nao da para
// reaproveitar o LOCALE_HTML: a lista do Stripe tem "es" e "en", nao
// "es-ES" nem "en-US", e ele recusa com erro 400 o que nao estiver nela.
export const LOCALE_STRIPE = { pt: "pt-BR", es: "es", en: "en" }

const pt = {
  // ── Geral ──
  "meta.tituloPagina": "Palco de Papéis",
  "comum.carregando": "Carregando...",
  "comum.sair": "Sair",
  "comum.precisaAjuda": "Precisa de ajuda? Entre em contato",
  "comum.emailCopiado": "Email copiado!",
  "idioma.rotulo": "Idioma",

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

// Espanhol e ingles. Chave ausente ou string vazia cai no portugues, entao
// da para traduzir aos poucos sem deixar o site num estado quebrado.
//
// "Palco de Papeis" fica em portugues nos tres idiomas, como marca. Por
// isso "Entrar al Palco" / "Enter the Palco" — pendente de confirmacao da
// Ana Lucia, junto com os outros termos da folha de glossario.

const es = {
  "meta.tituloPagina": "Palco de Papéis",
  "comum.carregando": "Cargando...",
  "comum.sair": "Salir",
  "comum.precisaAjuda": "¿Necesita ayuda? Contáctenos",
  "comum.emailCopiado": "¡Email copiado!",
  "idioma.rotulo": "Idioma",

  "auth.entrar": "Entrar",
  "auth.criarConta": "Crear cuenta",
  "auth.entrarNoPalco": "Entrar al Palco",
  "auth.email": "Usuario / Email",
  "auth.senha": "Contraseña",
  "auth.confirmarSenha": "Confirmar contraseña",
  "auth.esqueceuSenha": "¿Olvidó su contraseña?",
  "auth.semConta": "¿No tiene cuenta? Crear una",
  "auth.temConta": "¿Ya tiene cuenta? Entrar",
  "auth.entrando": "Entrando...",
  "auth.criandoConta": "Creando cuenta...",
  "auth.senhasNaoCoincidem": "Las contraseñas no coinciden.",
  "auth.emailJaTemConta":
    'Este email ya tiene una cuenta. Entre con su contraseña o use "¿Olvidó su contraseña?" para recuperar el acceso.',
  "auth.digiteEmailPrimeiro": "Escriba su email en el campo de arriba primero.",
  "auth.emailResetEnviado":
    "Email enviado. Revise su bandeja de entrada para restablecer la contraseña.",

  "confirmar.titulo": "Confirme su email",
  "confirmar.naoRecebeu": "¿No lo recibió? Revise la carpeta de spam o reenvíelo abajo.",
  "confirmar.reenviar": "Reenviar email",
  "confirmar.enviando": "Enviando...",
  "confirmar.voltarLogin": "Volver al inicio de sesión",
  "confirmar.reenviado": "Email reenviado. Revise su bandeja de entrada.",
  "confirmar.linkEnviado":
    "Enviamos un enlace de confirmación a {email}. Haga clic en el enlace para activar su cuenta y luego vuelva aquí para entrar.",

  "reset.titulo": "Restablecer contraseña",
  "reset.novaSenha": "Nueva contraseña",
  "reset.confirmarNovaSenha": "Confirmar nueva contraseña",
  "reset.salvar": "Guardar nueva contraseña",

  "bloqueado.titulo": "Cuenta suspendida",
  "bloqueado.mensagem":
    "Su cuenta fue suspendida. Póngase en contacto con el soporte para más información.",

  "paywall.padrao": "Su cuenta todavía no tiene una suscripción activa.",
  "paywall.pastDue":
    "No pudimos confirmar el pago de su suscripción. Actualice el método de pago para volver a usar el Palco.",
  "paywall.unpaid":
    "Su suscripción tiene una factura pendiente. Regularice el pago para volver a usar el Palco.",
  "paywall.incomplete":
    "El pago de su suscripción aún no fue confirmado. Complete el pago para liberar el acceso.",
  "paywall.incompleteExpired":
    "El pago de su suscripción no se completó a tiempo. Haga una nueva suscripción para volver a usar el Palco.",
  "paywall.canceled": "Su suscripción fue cancelada. ¡Esperamos verle de vuelta pronto!",
  "paywall.assinarAgora": "Suscribirse ahora",
  "paywall.regularizarPagamento": "Regularizar el pago",
  "paywall.redirecionando": "Redirigiendo...",

  "perfil.titulo": "Mi Perfil",
  "perfil.email": "Email",
  "perfil.trocarSenha": "Cambiar contraseña",
  "perfil.novaSenha": "Nueva Contraseña",
  "perfil.confirmarNovaSenha": "Confirmar nueva contraseña",
  "perfil.atualizarSenha": "Actualizar contraseña",
  "perfil.senhaAtualizada": "Contraseña actualizada con éxito.",
  "perfil.assinatura": "Suscripción",
  "perfil.status": "Estado",
  "perfil.proximaRenovacao": "Próxima renovación",
  "perfil.gerenciarStripe": "Gestionar suscripción en Stripe",
  "perfil.gerenciarAssinatura": "Gestionar suscripción",
  "perfil.abrindo": "Abriendo...",
  "perfil.voltarPalco": "Volver al palco",
  "perfil.semAssinatura": "Sin suscripción",
  "perfil.statusAtiva": "Activa",
  "perfil.statusVencida": "Vencida",
  "perfil.statusCancelada": "Cancelada",
  "perfil.statusInativa": "Inactiva",

  "menu.abrir": "Abrir menú",
  "menu.fechar": "Cerrar menú",
  "menu.meuPerfil": "MI PERFIL",
  "menu.salvar": "GUARDAR (.json)",
  "menu.carregar": "CARGAR (.json)",
  "menu.suporte": "SOPORTE",
  "menu.sair": "SALIR",

  "palco.lixeira": "Arrastre un elemento aquí para eliminarlo",
  "palco.arquivoInvalido": "Archivo de sesión inválido.",

  "rodape.contatos": "CONTACTOS",
  "rodape.suporte": "SOPORTE",

  "erro.credenciaisInvalidas": "Email o contraseña incorrectos.",
  "erro.emailNaoConfirmado":
    "Confirme su email antes de entrar. Revise su bandeja de entrada.",
  "erro.jaRegistrado":
    "Este email ya tiene una cuenta. Intente entrar o recuperar la contraseña.",
  "erro.senhaCurta": "La contraseña debe tener al menos 6 caracteres.",
  "erro.emailInvalido": "El formato del email parece inválido. Verifíquelo e intente de nuevo.",
  "erro.muitasTentativas": "Demasiados intentos. Espere unos minutos e intente de nuevo.",
  "erro.sessaoExpirou": "Su sesión expiró. Inicie sesión de nuevo.",
  "erro.problemaConexao": "Problema de conexión. Verifique su internet e intente de nuevo.",
  "erro.timeout": "El servidor tardó en responder. Intente de nuevo en unos instantes.",
  "erro.mesmaSenha": "La nueva contraseña no puede ser igual a la actual.",
  "erro.portalFalhou": "No fue posible abrir el portal de suscripción. Intente de nuevo.",
  "erro.checkoutFalhou": "No fue posible iniciar el pago. Intente de nuevo.",
  "erro.generico": "Algo salió mal. Intente de nuevo o póngase en contacto con el soporte.",
}

const en = {
  "meta.tituloPagina": "Palco de Papéis",
  "comum.carregando": "Loading...",
  "comum.sair": "Log out",
  "comum.precisaAjuda": "Need help? Get in touch",
  "comum.emailCopiado": "Email copied!",
  "idioma.rotulo": "Language",

  "auth.entrar": "Sign in",
  "auth.criarConta": "Create account",
  "auth.entrarNoPalco": "Enter the Palco",
  "auth.email": "Username / Email",
  "auth.senha": "Password",
  "auth.confirmarSenha": "Confirm password",
  "auth.esqueceuSenha": "Forgot your password?",
  "auth.semConta": "No account? Create one",
  "auth.temConta": "Already have an account? Sign in",
  "auth.entrando": "Signing in...",
  "auth.criandoConta": "Creating account...",
  "auth.senhasNaoCoincidem": "The passwords do not match.",
  "auth.emailJaTemConta":
    'This email already has an account. Sign in with your password or use "Forgot your password?" to recover access.',
  "auth.digiteEmailPrimeiro": "Enter your email in the field above first.",
  "auth.emailResetEnviado": "Email sent. Check your inbox to reset your password.",

  "confirmar.titulo": "Confirm your email",
  "confirmar.naoRecebeu": "Didn't get it? Check your spam folder or resend below.",
  "confirmar.reenviar": "Resend email",
  "confirmar.enviando": "Sending...",
  "confirmar.voltarLogin": "Back to sign in",
  "confirmar.reenviado": "Email resent. Check your inbox.",
  "confirmar.linkEnviado":
    "We sent a confirmation link to {email}. Click the link to activate your account, then come back here to sign in.",

  "reset.titulo": "Reset password",
  "reset.novaSenha": "New password",
  "reset.confirmarNovaSenha": "Confirm new password",
  "reset.salvar": "Save new password",

  "bloqueado.titulo": "Account suspended",
  "bloqueado.mensagem":
    "Your account has been suspended. Please contact support for more information.",

  "paywall.padrao": "Your account does not have an active subscription yet.",
  "paywall.pastDue":
    "We couldn't confirm your subscription payment. Update your payment method to use the Palco again.",
  "paywall.unpaid":
    "Your subscription has an outstanding invoice. Settle the payment to use the Palco again.",
  "paywall.incomplete":
    "Your subscription payment hasn't been confirmed yet. Complete the payment to unlock access.",
  "paywall.incompleteExpired":
    "Your subscription payment wasn't completed in time. Start a new subscription to use the Palco again.",
  "paywall.canceled": "Your subscription was canceled. We hope to see you back soon!",
  "paywall.assinarAgora": "Subscribe now",
  "paywall.regularizarPagamento": "Update payment",
  "paywall.redirecionando": "Redirecting...",

  "perfil.titulo": "My Profile",
  "perfil.email": "Email",
  "perfil.trocarSenha": "Change password",
  "perfil.novaSenha": "New Password",
  "perfil.confirmarNovaSenha": "Confirm new password",
  "perfil.atualizarSenha": "Update password",
  "perfil.senhaAtualizada": "Password updated successfully.",
  "perfil.assinatura": "Subscription",
  "perfil.status": "Status",
  "perfil.proximaRenovacao": "Next renewal",
  "perfil.gerenciarStripe": "Manage subscription on Stripe",
  "perfil.gerenciarAssinatura": "Manage subscription",
  "perfil.abrindo": "Opening...",
  "perfil.voltarPalco": "Back to the palco",
  "perfil.semAssinatura": "No subscription",
  "perfil.statusAtiva": "Active",
  "perfil.statusVencida": "Past due",
  "perfil.statusCancelada": "Canceled",
  "perfil.statusInativa": "Inactive",

  "menu.abrir": "Open menu",
  "menu.fechar": "Close menu",
  "menu.meuPerfil": "MY PROFILE",
  "menu.salvar": "SAVE (.json)",
  "menu.carregar": "LOAD (.json)",
  "menu.suporte": "SUPPORT",
  "menu.sair": "LOG OUT",

  "palco.lixeira": "Drag an item here to remove it",
  "palco.arquivoInvalido": "Invalid session file.",

  "rodape.contatos": "CONTACT",
  "rodape.suporte": "SUPPORT",

  "erro.credenciaisInvalidas": "Incorrect email or password.",
  "erro.emailNaoConfirmado": "Confirm your email before signing in. Check your inbox.",
  "erro.jaRegistrado":
    "This email already has an account. Try signing in or recovering the password.",
  "erro.senhaCurta": "The password must be at least 6 characters.",
  "erro.emailInvalido": "The email format looks invalid. Check it and try again.",
  "erro.muitasTentativas": "Too many attempts. Wait a few minutes and try again.",
  "erro.sessaoExpirou": "Your session has expired. Please sign in again.",
  "erro.problemaConexao": "Connection problem. Check your internet and try again.",
  "erro.timeout": "The server took too long to respond. Try again in a moment.",
  "erro.mesmaSenha": "The new password cannot be the same as the current one.",
  "erro.portalFalhou": "We couldn't open the subscription portal. Please try again.",
  "erro.checkoutFalhou": "We couldn't start the payment. Please try again.",
  "erro.generico": "Something went wrong. Try again or contact support.",
}

const DICIONARIOS = { pt, es, en }

let idioma = IDIOMA_PADRAO
const ouvintes = new Set()

/** Idioma em uso agora. */
export function idiomaAtual() {
  return idioma
}

/**
 * Registra uma funcao para rodar sempre que o idioma mudar. Serve para o
 * que traduzirDom nao resolve sozinho — marcar a opcao ativa no seletor,
 * por exemplo. Devolve uma funcao que cancela o registro.
 */
export function aoTrocarIdioma(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
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
  ouvintes.forEach((fn) => fn(codigo))
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
