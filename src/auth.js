import { createClient } from '@supabase/supabase-js'
import { initApp } from './app.js'

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
    return "Email ou senha incorretos."
  if (m.includes("email not confirmed"))
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada."
  if (m.includes("user already registered"))
    return "Este email já possui uma conta. Tente entrar ou recuperar a senha."
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres."
  if (m.includes("unable to validate email address") || m.includes("invalid format"))
    return "O formato do email parece inválido. Verifique e tente novamente."
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("429"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente."
  if (m.includes("auth session missing") || m.includes("session_not_found"))
    return "Sua sessão expirou. Faça login novamente."
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch"))
    return "Problema de conexão. Verifique sua internet e tente novamente."
  if (m.includes("timeout"))
    return "O servidor demorou para responder. Tente novamente em instantes."
  if (m.includes("same password"))
    return "A nova senha não pode ser igual à senha atual."
  if (m.includes("portal"))
    return "Não foi possível abrir o portal de assinatura. Tente novamente."
  if (m.includes("checkout"))
    return "Não foi possível iniciar o pagamento. Tente novamente."
  return "Algo deu errado. Tente novamente ou entre em contato com o suporte."
}

let authMode = "login"
let lastKnownUserEmail = ""
let currentView = null
let appLoaded = false

const APP_BODY_HTML = `
<header id="app-header">
  <img id="app-logo" src="/assets/design/logo-palco.png" alt="Palco de Papéis">
  <button id="menu-toggle" aria-label="Abrir menu">
    <img id="menu-icon-img" src="/assets/design/menu-open.png" alt="Menu">
  </button>
</header>

<div id="side-menu-overlay" class="hidden"></div>
<nav id="side-menu" class="hidden">
  <div id="side-menu-header">
    <span id="user-email">...</span>
    <button id="menu-close-btn" aria-label="Fechar menu">
      <img id="menu-close-img" src="/assets/design/menu-close.png" alt="Fechar">
    </button>
  </div>
  <button id="menu-profile" class="side-menu-btn">Meu perfil</button>
  <button id="btn-save" class="side-menu-btn">Salvar (.json)</button>
  <label class="file-btn-menu">
    Carregar (.json)
    <input type="file" id="load-input" accept="application/json">
  </label>
  <button id="menu-support" class="side-menu-btn" data-support-email="thedatabra@gmail.com">Suporte</button>
  <button id="menu-logout" class="side-menu-btn">Sair</button>
</nav>

<section id="stage-section">
  <div id="stage-wrapper">
    <img id="stage-bg" src="/assets/design/cenario-palco.png" alt="Palco">
    <svg id="connections-layer"></svg>
    <div id="items-layer"></div>
    <button id="trash" title="Arraste um item aqui para remover">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>
    <div id="zoom-control">
      <span id="zoom-label">Zoom: 100%</span>
      <div class="zoom-row">
        <button id="zoom-minus">-</button>
        <input type="range" id="zoom-slider" min="50" max="250" value="96">
        <button id="zoom-plus">+</button>
      </div>
    </div>
    <div id="top-bar"></div>
    <div id="help-bar">Arraste da paleta | Scroll: redimensionar | Botão direito: conectar | Del/lixeira: remover | Duplo clique: rotular</div>
  </div>
</section>

<section id="palette-section">
  <aside id="palette">
    <div class="palette-col" id="col-pieces"></div>
    <div class="palette-col" id="col-bases"></div>
  </aside>
  <div id="palette-badges">
    <img src="/assets/design/selo-empatia.png" alt="Empatia">
    <img src="/assets/design/selo-fortalecimento.png" alt="Fortalecimento Social">
  </div>
</section>

<footer id="app-footer">
  <div class="footer-logos">
    <img src="/assets/design/logo-palco.png" alt="Palco de Papéis">
    <img src="/assets/design/logo-analucia.png" alt="Ana L. Tavares">
  </div>
  <div class="footer-contacts">
    <p class="footer-contacts-title">CONTATOS</p>
    <span>INSTAGRAM</span>
    <span>FACEBOOK</span>
    <span>WHATSAPP</span>
  </div>
  <p class="footer-email">contato@analuciatavares.com.br</p>
  <button id="footer-support" class="footer-support-btn" data-support-email="thedatabra@gmail.com">SUPORTE</button>
</footer>
`

async function ensureAppLoaded() {
  if (appLoaded) return
  document.getElementById("app-body").innerHTML = APP_BODY_HTML

  // Resolve refs dinâmicas após injeção do HTML
  userEmailLabel = document.getElementById("user-email")
  menuLogoutBtn  = document.getElementById("menu-logout")
  menuProfileBtn = document.getElementById("menu-profile")
  menuSupportBtn = document.getElementById("menu-support")

  // Hamburguer menu
  const menuToggle    = document.getElementById("menu-toggle")
  const sideMenu      = document.getElementById("side-menu")
  const sideOverlay   = document.getElementById("side-menu-overlay")
  const menuCloseBtn  = document.getElementById("menu-close-btn")
  const menuIconImg   = document.getElementById("menu-icon-img")

  function openMenu() {
    sideMenu.classList.remove("hidden")
    sideOverlay.classList.remove("hidden")
    if (menuIconImg) menuIconImg.src = "/assets/design/menu-close.png"
  }
  function closeMenu() {
    sideMenu.classList.add("hidden")
    sideOverlay.classList.add("hidden")
    if (menuIconImg) menuIconImg.src = "/assets/design/menu-open.png"
  }

  menuToggle?.addEventListener("click", () => {
    sideMenu.classList.contains("hidden") ? openMenu() : closeMenu()
  })
  menuCloseBtn?.addEventListener("click", closeMenu)
  sideOverlay?.addEventListener("click", closeMenu)

  // Footer suporte
  const footerSupport = document.getElementById("footer-support")
  footerSupport?.addEventListener("click", () => copiarEmailSuporte(footerSupport))

  // Logout e perfil via side menu
  menuLogoutBtn?.addEventListener("click", () => { closeMenu(); handleLogout() })
  menuProfileBtn?.addEventListener("click", async () => {
    closeMenu()
    if (profileEmail) profileEmail.value = lastKnownUserEmail
    if (profileNewPassword) profileNewPassword.value = ""
    if (profileConfirmPassword) profileConfirmPassword.value = ""
    if (profilePasswordMessage) { profilePasswordMessage.classList.remove("form-success"); profilePasswordMessage.textContent = "" }
    if (profileBillingMessage) profileBillingMessage.textContent = ""
    if (btnManageBilling) { btnManageBilling.disabled = false; btnManageBilling.textContent = "Gerenciar assinatura no Stripe" }
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
  if (view === "auth") {
    authSubmitBtn.disabled = false
    authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta"
  }
}

btnResend.addEventListener("click", async () => {
  confirmError.textContent = ""
  btnResend.disabled = true
  btnResend.innerHTML = '<span class="spinner"></span>Enviando...'
  const email = btnResend.dataset.email || ""
  const { error } = await supabaseClient.auth.resend({ type: "signup", email })
  btnResend.disabled = false
  btnResend.textContent = "Reenviar email"
  if (error) {
    confirmError.textContent = mensagemAmigavel(error.message)
  } else {
    confirmError.classList.add("form-success")
    confirmError.textContent = "Email reenviado. Verifique sua caixa de entrada."
  }
})

btnBackToLogin.addEventListener("click", () => {
  authMode = "login"
  authModeLabel.textContent = "Entrar"
  authSubmitBtn.textContent = "Entrar"
  authToggleLink.textContent = "Nao tem conta? Criar uma"
  authError.textContent = ""
  authEmail.value = ""
  authPassword.value = ""
  showOnly("auth")
})

authToggleLink.addEventListener("click", (evt) => {
  evt.preventDefault()
  authMode = authMode === "login" ? "signup" : "login"
  authModeLabel.textContent = authMode === "login" ? "Entrar" : "Criar conta"
  authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta"
  authToggleLink.textContent =
    authMode === "login" ? "Nao tem conta? Criar uma" : "Ja tem conta? Entrar"
  authError.classList.remove("form-success")
  authError.textContent = ""
})

authForm.addEventListener("submit", async (evt) => {
  evt.preventDefault()
  authError.classList.remove("form-success")
  authError.textContent = ""
  const email = authEmail.value.trim()
  const password = authPassword.value

  const label = authMode === "login" ? "Entrando..." : "Criando conta..."
  authSubmitBtn.disabled = true
  authSubmitBtn.innerHTML = `<span class="spinner"></span>${label}`

  const { error } =
    authMode === "login"
      ? await supabaseClient.auth.signInWithPassword({ email, password })
      : await supabaseClient.auth.signUp({ email, password })

  if (error) {
    authError.textContent = mensagemAmigavel(error.message)
    authSubmitBtn.disabled = false
    authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta"
    return
  }
  if (authMode === "signup") {
    confirmEmailDesc.textContent = `Enviamos um link de confirmação para ${email}. Clique no link para ativar sua conta e então volte aqui para entrar.`
    confirmError.textContent = ""
    btnResend.dataset.email = email
    authSubmitBtn.disabled = false
    authSubmitBtn.textContent = "Criar conta"
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
    authError.textContent = "Digite seu email no campo acima primeiro."
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
  authError.textContent = "Email enviado. Verifique sua caixa de entrada para redefinir a senha."
})

resetForm.addEventListener("submit", async (evt) => {
  evt.preventDefault()
  resetError.textContent = ""
  if (resetNewPassword.value !== resetConfirmPassword.value) {
    resetError.textContent = "As senhas nao coincidem."
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
  subStatus.textContent = "Carregando..."
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
    subStatus.textContent = "Sem assinatura"
    subStatus.className = "sub-value status-inactive"
    return
  }

  const statusMap = {
    active:   { texto: "Ativa",     classe: "status-active"   },
    past_due: { texto: "Vencida",   classe: "status-past-due" },
    canceled: { texto: "Cancelada", classe: "status-inactive" },
    inactive: { texto: "Inativa",   classe: "status-inactive" },
  }
  const info = statusMap[data.status] ?? { texto: data.status, classe: "" }
  subStatus.textContent = info.texto
  subStatus.className = `sub-value ${info.classe}`

  if (data.current_period_end) {
    subRenewal.textContent = new Date(data.current_period_end).toLocaleDateString("pt-BR", {
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
    profilePasswordMessage.textContent = "As senhas nao coincidem."
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
  profilePasswordMessage.textContent = "Senha atualizada com sucesso."
})

btnManageBilling.addEventListener("click", async () => {
  profileBillingMessage.textContent = ""
  btnManageBilling.disabled = true
  btnManageBilling.innerHTML = '<span class="spinner"></span>Abrindo...'
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const accessToken = sessionData.session?.access_token
    const res = await fetch(`${FUNCTIONS_URL}/create-portal-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
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
    btnManageBilling.textContent = "Gerenciar assinatura"
  }
})

subscribeBtn.addEventListener("click", async () => {
  paywallError.textContent = ""
  subscribeBtn.disabled = true
  subscribeBtn.innerHTML = '<span class="spinner"></span>Redirecionando...'
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const accessToken = sessionData.session?.access_token
    const res = await fetch(`${FUNCTIONS_URL}/create-checkout-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const body = await res.json()
    if (body.url) {
      window.location.href = body.url
    } else {
      throw new Error(body.error || "checkout")
    }
  } catch (err) {
    paywallError.textContent = mensagemAmigavel(String(err.message || err))
    subscribeBtn.disabled = false
    subscribeBtn.textContent = "Assinar agora"
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
    if (status === "canceled") {
      paywallMessage.textContent = "Sua assinatura foi cancelada. Esperamos te ver de volta em breve!"
    } else {
      paywallMessage.textContent = "Sua conta ainda nao tem uma assinatura ativa."
    }
    subscribeBtn.disabled = false
    subscribeBtn.textContent = "Assinar agora"
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
    btn.textContent = "Email copiado!"
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

refreshAccessState()

if (new URLSearchParams(window.location.search).get("portal") === "return") {
  setTimeout(refreshAccessState, 3000)
}
