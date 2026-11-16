import { createClient } from '@supabase/supabase-js'
import { initApp } from './app.js'
import { t, setTexto, traduzirDom, definirIdioma, detectarIdioma, idiomaAtual, aoTrocarIdioma, LOCALE_HTML, LOCALE_STRIPE } from './i18n.js'

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL

const loadingOverlay = document.getElementById("loading-overlay")
const authOverlay = document.getElementById("auth-overlay")
const confirmOverlay = document.getElementById("confirm-overlay")
const confirmEmailDesc = document.getElementById("confirm-email-desc")
const confirmError = document.getElementById("confirm-error")
const btnResend = document.getElementById("btn-resend")
const btnBackToLogin = document.getElementById("btn-back-to-login")
const paywallOverlay = document.getElementById("paywall-overlay")
const profileOverlay = document.getElementById("profile-overlay")
const appRoot = document.getElementById("app")
const langSwitchAuth = document.getElementById("lang-switch-auth")
const authForm = document.getElementById("auth-form")
const authEmail = document.getElementById("auth-email")
const authPassword = document.getElementById("auth-password")
const authError = document.getElementById("auth-error")
const authModeLabel = document.getElementById("auth-mode-label")
const authSubmitBtn = document.getElementById("auth-submit")
const authToggleLink = document.getElementById("auth-toggle-mode")
const authForgotPasswordLink = document.getElementById("auth-forgot-password")
const resetOverlay = document.getElementById("reset-overlay")
const resetForm = document.getElementById("reset-form")
const resetNewPassword = document.getElementById("reset-new-password")
const resetConfirmPassword = document.getElementById("reset-confirm-password")
const resetError = document.getElementById("reset-error")
const logoutBtn = document.getElementById("btn-logout")
const subscribeBtn = document.getElementById("btn-subscribe")
const paywallError = document.getElementById("paywall-error")
const paywallMessage = document.getElementById("paywall-message")
let userEmailLabel = null
let menuLogoutBtn = null
let menuProfileBtn = null
let menuSupportBtn = null
const paywallSupportBtn = document.getElementById("paywall-support")
const blockedOverlay = document.getElementById("blocked-overlay")
const btnLogoutBlocked = document.getElementById("btn-logout-blocked")
const blockedSupportBtn = document.getElementById("blocked-support")
const profileEmail = document.getElementById("profile-email")
const profilePasswordForm = document.getElementById("profile-password-form")
const profileNewPassword = document.getElementById("profile-new-password")
const profileConfirmPassword = document.getElementById("profile-confirm-password")
const profilePasswordMessage = document.getElementById("profile-password-message")
const btnProfileBack = document.getElementById("btn-profile-back")
const btnManageBilling = document.getElementById("btn-manage-billing")
const profileBillingMessage = document.getElementById("profile-billing-message")

function mensagemAmigavel(raw) {
  const m = (raw || "").toLowerCase()
  if (m.includes("invalid login credentials"))
    return t("erro.credenciaisInvalidas")
  if (m.includes("email not confirmed"))
    return t("erro.emailNaoConfirmado")
  if (m.includes("user already registered"))
    return t("erro.jaRegistrado")
  if (m.includes("password should be at least"))
    return t("erro.senhaCurta")
  if (m.includes("unable to validate email address") || m.includes("invalid format"))
    return t("erro.emailInvalido")
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("429"))
    return t("erro.muitasTentativas")
  if (m.includes("auth session missing") || m.includes("session_not_found"))
    return t("erro.sessaoExpirou")
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch"))
    return t("erro.problemaConexao")
  if (m.includes("timeout"))
    return t("erro.timeout")
  if (m.includes("same password"))
    return t("erro.mesmaSenha")
  if (m.includes("portal"))
    return t("erro.portalFalhou")
  if (m.includes("checkout"))
    return t("erro.checkoutFalhou")
  return t("erro.generico")
}

let authMode = "login"
let lastKnownUserEmail = ""
let currentView = null
let appLoaded = false

const APP_BODY_HTML = `
<header id="app-header">
  <img id="app-logo" src="/assets/design/logo-palco.png" alt="Palco de Papéis">
  <div id="header-right">
    <div class="lang-switch" role="group" data-i18n-aria="idioma.rotulo" aria-label="Idioma">
      <button type="button" class="lang-opt" data-lang="pt">PT</button>
      <button type="button" class="lang-opt" data-lang="es">ES</button>
      <button type="button" class="lang-opt" data-lang="en">EN</button>
    </div>
    <button id="menu-toggle" data-i18n-aria="menu.abrir" aria-label="Abrir menu">
      <img id="menu-icon-img" src="/assets/design/menu-open.png" alt="Menu">
    </button>
  </div>
</header>

<div id="side-menu-overlay" class="hidden"></div>
<nav id="side-menu" class="hidden">
  <button id="menu-close-btn" data-i18n-aria="menu.fechar" aria-label="Fechar menu">✕</button>
  <button id="menu-profile" class="side-menu-btn" data-i18n="menu.meuPerfil">MEU PERFIL</button>
  <button id="btn-save" class="side-menu-btn" data-i18n="menu.salvar">SALVAR (.json)</button>
  <label class="file-btn-menu side-menu-btn">
    <span data-i18n="menu.carregar">CARREGAR (.json)</span>
    <input type="file" id="load-input" accept="application/json">
  </label>
  <a href="https://wa.me/556798813139" target="_blank" rel="noopener" class="side-menu-btn" data-i18n="menu.suporte">SUPORTE</a>
  <button id="menu-logout" class="side-menu-btn" data-i18n="menu.sair">SAIR</button>
</nav>

<section id="stage-section">
  <div id="stage-wrapper">
    <img id="stage-bg" src="/assets/design/cenario-palco.png" alt="Palco">
    <div id="items-layer"></div>
    <div id="top-bar"></div>
    <div id="palette-overlay">
      <button id="trash" data-i18n-title="palco.lixeira" title="Arraste um item aqui para remover">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="palette-pill" id="col-pieces"></div>
      <div class="palette-pill" id="col-bases"></div>
    </div>
  </div>
</section>

<section id="badges-section">
  <img src="/assets/design/selo-empatia.png" alt="Empatia" class="badge-item">
  <div id="badges-shapes">
    <img src="/assets/design/elipse-vermelha.png" alt="">
    <img src="/assets/design/losango-azul.png" alt="">
    <img src="/assets/design/elipse-verde.png" alt="">
  </div>
  <img src="/assets/design/selo-fortalecimento.png" alt="Fortalecimento Social" class="badge-item">
</section>

<footer id="app-footer">
  <img src="/assets/design/logo-palco.png" alt="Palco de Papéis" class="footer-logo">
  <img src="/assets/design/logo-analucia.png" alt="Ana L. Tavares" class="footer-logo">
  <div class="footer-contacts">
    <p class="footer-contacts-title" data-i18n="rodape.contatos">CONTATOS</p>
    <a href="https://www.instagram.com/palcodepapeis/" target="_blank" rel="noopener">INSTAGRAM</a>
    <a href="https://wa.me/5516981960421" target="_blank" rel="noopener">WHATSAPP</a>
  </div>
  <p class="footer-email">contato@analuciatavares.com.br</p>
  <a href="https://wa.me/556798813139" target="_blank" rel="noopener" class="footer-support-btn" data-i18n="rodape.suporte">SUPORTE</a>
</footer>
`

async function ensureAppLoaded() {
  if (appLoaded) return
  document.getElementById("app-body").innerHTML = APP_BODY_HTML
  traduzirDom(document.getElementById("app-body"))
  marcarIdiomaAtivo()

  // Resolve refs dinâmicas após injeção do HTML
  userEmailLabel = null // email removido do menu
  menuLogoutBtn  = document.getElementById("menu-logout")
  menuProfileBtn = document.getElementById("menu-profile")
  menuSupportBtn = null // suporte agora é link direto WhatsApp

  // Hamburguer menu
  const menuToggle    = document.getElementById("menu-toggle")
  const sideMenu      = document.getElementById("side-menu")
  const sideOverlay   = document.getElementById("side-menu-overlay")
  const menuCloseBtn  = document.getElementById("menu-close-btn")
  const menuIconImg   = document.getElementById("menu-icon-img")

  function openMenu() {
    sideMenu.classList.remove("hidden")
    sideOverlay.classList.remove("hidden")
  }
  function closeMenu() {
    sideMenu.classList.add("hidden")
    sideOverlay.classList.add("hidden")
  }

  menuToggle?.addEventListener("click", () => {
    sideMenu.classList.contains("hidden") ? openMenu() : closeMenu()
  })
  menuCloseBtn?.addEventListener("click", closeMenu)
  sideOverlay?.addEventListener("click", closeMenu)


  // Logout e perfil via side menu
  menuLogoutBtn?.addEventListener("click", () => { closeMenu(); handleLogout() })
  menuProfileBtn?.addEventListener("click", async () => {
    closeMenu()
    if (profileEmail) profileEmail.value = lastKnownUserEmail
    if (profileNewPassword) profileNewPassword.value = ""
    if (profileConfirmPassword) profileConfirmPassword.value = ""
    if (profilePasswordMessage) { profilePasswordMessage.classList.remove("form-success"); profilePasswordMessage.textContent = "" }
    if (profileBillingMessage) profileBillingMessage.textContent = ""
    if (btnManageBilling) { btnManageBilling.disabled = false; setTexto(btnManageBilling, "perfil.gerenciarStripe") }
    showOnly("profile")
    await carregarInfoAssinatura()
  })
  menuSupportBtn?.addEventListener("click", () => copiarEmailSuporte(menuSupportBtn))

  initApp()
  appLoaded = true
  window.__track?.("sessao_inicio")
  window.addEventListener("beforeunload", () => window.__track?.("sessao_fim"))
}

function showOnly(view) {
  loadingOverlay.classList.add("hidden")
  currentView = view
  authOverlay.classList.toggle("hidden", view !== "auth")
  confirmOverlay.classList.toggle("hidden", view !== "confirm")
  resetOverlay.classList.toggle("hidden", view !== "reset")
  paywallOverlay.classList.toggle("hidden", view !== "paywall")
  blockedOverlay.classList.toggle("hidden", view !== "blocked")
  profileOverlay.classList.toggle("hidden", view !== "profile")
  appRoot.classList.toggle("hidden", view !== "app")
  // No app logado quem manda e o seletor do cabecalho; o fixo sairia por
  // cima do botao de menu. Nas demais telas (inclusive o perfil, que e um
  // overlay por cima do app) o fixo e o unico alcancavel.
  langSwitchAuth?.classList.toggle("hidden", view === "app")
  if (view === "auth") {
    authSubmitBtn.disabled = false
    setTexto(authSubmitBtn, authMode === "login" ? "auth.entrar" : "auth.criarConta")
  }
}

btnResend.addEventListener("click", async () => {
  confirmError.textContent = ""
  btnResend.disabled = true
  btnResend.innerHTML = `<span class="spinner"></span>${t("confirmar.enviando")}`
  const email = btnResend.dataset.email || ""
  const { error } = await supabaseClient.auth.resend({ type: "signup", email })
  btnResend.disabled = false
  setTexto(btnResend, "confirmar.reenviar")
  if (error) {
    confirmError.textContent = mensagemAmigavel(error.message)
  } else {
    confirmError.classList.add("form-success")
    confirmError.textContent = t("confirmar.reenviado")
  }
})

btnBackToLogin.addEventListener("click", () => {
  authMode = "login"
  setTexto(authModeLabel, "auth.entrar")
  setTexto(authSubmitBtn, "auth.entrar")
  setTexto(authToggleLink, "auth.semConta")
  authError.textContent = ""
  authEmail.value = ""
  authPassword.value = ""
  showOnly("auth")
})

const authConfirmWrap = document.getElementById("auth-confirm-wrap")
const authConfirmPassword = document.getElementById("auth-confirm-password")

authToggleLink.addEventListener("click", (evt) => {
  evt.preventDefault()
  authMode = authMode === "login" ? "signup" : "login"
  setTexto(authModeLabel, authMode === "login" ? "auth.entrar" : "auth.criarConta")
  setTexto(authSubmitBtn, authMode === "login" ? "auth.entrarNoPalco" : "auth.criarConta")
  setTexto(authToggleLink, authMode === "login" ? "auth.semConta" : "auth.temConta")
  authConfirmWrap.style.display = authMode === "signup" ? "flex" : "none"
  authConfirmPassword.value = ""
  authError.classList.remove("form-success")
  authError.textContent = ""
})

authForm.addEventListener("submit", async (evt) => {
  evt.preventDefault()
  authError.classList.remove("form-success")
  authError.textContent = ""
  const email = authEmail.value.trim()
  const password = authPassword.value

  if (authMode === "signup" && password !== authConfirmPassword.value) {
    authError.textContent = t("auth.senhasNaoCoincidem")
    return
  }

  const label = t(authMode === "login" ? "auth.entrando" : "auth.criandoConta")
  authSubmitBtn.disabled = true
  authSubmitBtn.innerHTML = `<span class="spinner"></span>${label}`

  const { data, error } =
    authMode === "login"
      ? await supabaseClient.auth.signInWithPassword({ email, password })
      // O idioma vai no metadata do usuario para o template de email do
      // Supabase saber em que lingua escrever ({{ .Data.lang }}). E a unica
      // via: o Supabase monta o email no servidor, sem ver a tela.
      : await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { lang: idiomaAtual() } },
        })

  if (error) {
    authError.textContent = mensagemAmigavel(error.message)
    authSubmitBtn.disabled = false
    setTexto(authSubmitBtn, authMode === "login" ? "auth.entrar" : "auth.criarConta")
    return
  }
  if (authMode === "signup") {
    // Quando o email ja tem conta, o Supabase responde 200 e nao envia nada,
    // de proposito: dizer "esse email ja existe" permitiria descobrir quais
    // emails estao cadastrados. O sinal e o usuario voltar sem identidades.
    // So tratamos como repetido se vier array vazio mesmo — se vier undefined,
    // seguimos o fluxo normal em vez de barrar um cadastro legitimo.
    const identidades = data?.user?.identities
    if (Array.isArray(identidades) && identidades.length === 0) {
      authError.textContent = t("auth.emailJaTemConta")
      authSubmitBtn.disabled = false
      setTexto(authSubmitBtn, "auth.criarConta")
      return
    }
    setTexto(confirmEmailDesc, "confirmar.linkEnviado", { email })
    confirmError.textContent = ""
    btnResend.dataset.email = email
    authSubmitBtn.disabled = false
    setTexto(authSubmitBtn, "auth.criarConta")
    showOnly("confirm")
    return
  }
  await refreshAccessState()
})

authForgotPasswordLink.addEventListener("click", async (evt) => {
  evt.preventDefault()
  authError.classList.remove("form-success")
  const email = authEmail.value.trim()
  if (!email) {
    authError.textContent = t("auth.digiteEmailPrimeiro")
    return
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  })
  if (error) {
    authError.textContent = mensagemAmigavel(error.message)
    return
  }
  authError.classList.add("form-success")
  authError.textContent = t("auth.emailResetEnviado")
})

resetForm.addEventListener("submit", async (evt) => {
  evt.preventDefault()
  resetError.textContent = ""
  if (resetNewPassword.value !== resetConfirmPassword.value) {
    resetError.textContent = t("auth.senhasNaoCoincidem")
    return
  }
  const { error } = await supabaseClient.auth.updateUser({ password: resetNewPassword.value })
  if (error) {
    resetError.textContent = mensagemAmigavel(error.message)
    return
  }
  resetNewPassword.value = ""
  resetConfirmPassword.value = ""
  currentView = null
  await refreshAccessState()
})

async function handleLogout() {
  await supabaseClient.auth.signOut()
  await refreshAccessState()
}
logoutBtn.addEventListener("click", handleLogout)

const subStatus  = document.getElementById("sub-status")
const subRenewal = document.getElementById("sub-renewal")

async function carregarInfoAssinatura() {
  setTexto(subStatus, "comum.carregando")
  subStatus.className = "sub-value"
  subRenewal.textContent = "—"

  const { data: sessionData } = await supabaseClient.auth.getSession()
  const userId = sessionData.session?.user?.id
  if (!userId) return

  const { data } = await supabaseClient
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle()

  if (!data) {
    setTexto(subStatus, "perfil.semAssinatura")
    subStatus.className = "sub-value status-inactive"
    return
  }

  const statusMap = {
    active:   { chave: "perfil.statusAtiva",     classe: "status-active"   },
    past_due: { chave: "perfil.statusVencida",   classe: "status-past-due" },
    canceled: { chave: "perfil.statusCancelada", classe: "status-inactive" },
    inactive: { chave: "perfil.statusInativa",   classe: "status-inactive" },
  }
  const info = statusMap[data.status] ?? { chave: null, classe: "" }
  subStatus.textContent = info.chave ? t(info.chave) : data.status
  subStatus.className = `sub-value ${info.classe}`

  if (data.current_period_end) {
    subRenewal.textContent = new Date(data.current_period_end).toLocaleDateString(LOCALE_HTML[idiomaAtual()], {
      day: "2-digit", month: "long", year: "numeric",
    })
  } else {
    subRenewal.textContent = "—"
  }
}


btnProfileBack.addEventListener("click", () => {
  showOnly("app")
})

profilePasswordForm.addEventListener("submit", async (evt) => {
  evt.preventDefault()
  profilePasswordMessage.textContent = ""
  profilePasswordMessage.classList.remove("form-success")
  if (profileNewPassword.value !== profileConfirmPassword.value) {
    profilePasswordMessage.textContent = t("auth.senhasNaoCoincidem")
    return
  }
  const { error } = await supabaseClient.auth.updateUser({ password: profileNewPassword.value })
  if (error) {
    profilePasswordMessage.textContent = mensagemAmigavel(error.message)
    return
  }
  profileNewPassword.value = ""
  profileConfirmPassword.value = ""
  profilePasswordMessage.classList.add("form-success")
  profilePasswordMessage.textContent = t("perfil.senhaAtualizada")
})

btnManageBilling.addEventListener("click", async () => {
  profileBillingMessage.textContent = ""
  btnManageBilling.disabled = true
  btnManageBilling.innerHTML = `<span class="spinner"></span>${t("perfil.abrindo")}`
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const accessToken = sessionData.session?.access_token
    const res = await fetch(`${FUNCTIONS_URL}/create-portal-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ locale: LOCALE_STRIPE[idiomaAtual()] }),
    })
    const body = await res.json()
    if (body.url) {
      window.location.href = body.url
    } else {
      throw new Error(body.error || "portal")
    }
  } catch (err) {
    profileBillingMessage.textContent = mensagemAmigavel(String(err.message || err))
    btnManageBilling.disabled = false
    setTexto(btnManageBilling, "perfil.gerenciarAssinatura")
  }
})

subscribeBtn.addEventListener("click", async () => {
  const endpoint = paywallAcao === "portal" ? "create-portal-session" : "create-checkout-session"
  paywallError.textContent = ""
  subscribeBtn.disabled = true
  subscribeBtn.innerHTML = `<span class="spinner"></span>${t("paywall.redirecionando")}`
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const accessToken = sessionData.session?.access_token
    const res = await fetch(`${FUNCTIONS_URL}/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ locale: LOCALE_STRIPE[idiomaAtual()] }),
    })
    const body = await res.json()
    if (body.url) {
      window.location.href = body.url
    } else {
      throw new Error(body.error || paywallAcao)
    }
  } catch (err) {
    paywallError.textContent = mensagemAmigavel(String(err.message || err))
    subscribeBtn.disabled = false
    setTexto(subscribeBtn, CHAVE_ACAO[paywallAcao])
  }
})

async function registrarSessao(userId, email) {
  await supabaseClient.from("sessions").insert({
    user_id:    userId,
    email:      email,
    user_agent: navigator.userAgent,
  })
}

function configurarTracking(userId) {
  window.__track = (evento, dados = {}) => {
    supabaseClient.from("usage_events").insert({ user_id: userId, evento, dados })
  }
}

async function isUserBlocked(userId) {
  const { data } = await supabaseClient
    .from("profiles")
    .select("blocked")
    .eq("user_id", userId)
    .maybeSingle()
  return data?.blocked === true
}

// Mensagem e acao do paywall conforme o status que veio do Stripe.
// "portal" manda para o portal de cobranca, onde o cliente troca o cartao ou
// paga a fatura em aberto; "checkout" abre uma assinatura nova. Mandar quem
// esta inadimplente para o checkout criaria uma segunda assinatura no Stripe.
const PAYWALL_POR_STATUS = {
  past_due:           { acao: "portal",   chave: "paywall.pastDue" },
  unpaid:             { acao: "portal",   chave: "paywall.unpaid" },
  incomplete:         { acao: "portal",   chave: "paywall.incomplete" },
  incomplete_expired: { acao: "checkout", chave: "paywall.incompleteExpired" },
  canceled:           { acao: "checkout", chave: "paywall.canceled" },
}
const PAYWALL_PADRAO = { acao: "checkout", chave: "paywall.padrao" }
const CHAVE_ACAO = { portal: "paywall.regularizarPagamento", checkout: "paywall.assinarAgora" }
let paywallAcao = "checkout"

async function getSubscriptionInfo(userId) {
  const { data } = await supabaseClient
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle()
  if (!data) return { active: false, status: null }
  const stillValid = !data.current_period_end || new Date(data.current_period_end) > new Date()
  return { active: data.status === "active" && stillValid, status: data.status }
}

async function refreshAccessState() {
  if (currentView === "reset") return
  const { data } = await supabaseClient.auth.getSession()
  if (currentView === "reset") return
  const session = data.session
  if (!session) {
    showOnly("auth")
    return
  }
  const blocked = await isUserBlocked(session.user.id)
  if (currentView === "reset") return
  if (blocked) {
    showOnly("blocked")
    return
  }
  const { active, status } = await getSubscriptionInfo(session.user.id)
  if (currentView === "reset") return
  if (active) {
    configurarTracking(session.user.id)
    await ensureAppLoaded()
    lastKnownUserEmail = session.user.email
    if (userEmailLabel) userEmailLabel.textContent = session.user.email
    if (currentView !== "profile") {
      showOnly("app")
    }
  } else {
    const aviso = PAYWALL_POR_STATUS[status] ?? PAYWALL_PADRAO
    paywallAcao = aviso.acao
    setTexto(paywallMessage, aviso.chave)
    subscribeBtn.disabled = false
    setTexto(subscribeBtn, CHAVE_ACAO[aviso.acao])
    showOnly("paywall")
  }
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    resetError.textContent = ""
    showOnly("reset")
    return
  }
  if (event === "SIGNED_IN" && session) {
    registrarSessao(session.user.id, session.user.email)
  }
  refreshAccessState()
})

async function copiarEmailSuporte(btn) {
  const email = btn.dataset.supportEmail
  const textoOriginal = btn.textContent
  try {
    await navigator.clipboard.writeText(email)
    btn.textContent = t("comum.emailCopiado")
  } catch {
    btn.textContent = email
  }
  setTimeout(() => { btn.textContent = textoOriginal }, 2000)
}

paywallSupportBtn?.addEventListener("click", () => copiarEmailSuporte(paywallSupportBtn))
blockedSupportBtn?.addEventListener("click", () => copiarEmailSuporte(blockedSupportBtn))
btnLogoutBlocked?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut()
  await refreshAccessState()
})

/* ── Seletor de idioma ──
   Existem dois na pagina: o fixo das telas de auth (index.html) e o do
   cabecalho do app (APP_BODY_HTML). Um unico listener no document atende
   os dois, inclusive o do cabecalho, que so nasce depois do login. */

document.addEventListener("click", (evt) => {
  const opcao = evt.target.closest(".lang-opt")
  if (!opcao) return
  definirIdioma(opcao.dataset.lang)
})

/** Marca visualmente qual idioma esta em uso, nos dois seletores. */
function marcarIdiomaAtivo() {
  const atual = idiomaAtual()
  document.querySelectorAll(".lang-opt").forEach((opcao) => {
    const ativo = opcao.dataset.lang === atual
    opcao.classList.toggle("is-active", ativo)
    opcao.setAttribute("aria-pressed", String(ativo))
  })
}
aoTrocarIdioma(marcarIdiomaAtivo)

// Define o idioma antes da primeira tela: a escolha guardada, senao o do
// navegador, senao portugues. Tambem aplica as traducoes ao HTML estatico.
definirIdioma(detectarIdioma())

refreshAccessState()

if (new URLSearchParams(window.location.search).get("portal") === "return") {
  setTimeout(refreshAccessState, 3000)
}
