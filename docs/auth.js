"use strict";

/* ----------------------------------------------------------------
   Autenticacao (Supabase) + paywall (assinatura via Stripe)
   Carrega antes de app.js e controla quando o palco fica visivel.
   ---------------------------------------------------------------- */

const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
);

const loadingOverlay = document.getElementById("loading-overlay");
const authOverlay = document.getElementById("auth-overlay");
const confirmOverlay = document.getElementById("confirm-overlay");
const confirmEmailDesc = document.getElementById("confirm-email-desc");
const confirmError = document.getElementById("confirm-error");
const btnResend = document.getElementById("btn-resend");
const btnBackToLogin = document.getElementById("btn-back-to-login");
const paywallOverlay = document.getElementById("paywall-overlay");
const profileOverlay = document.getElementById("profile-overlay");
const appRoot = document.getElementById("app");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");
const authModeLabel = document.getElementById("auth-mode-label");
const authSubmitBtn = document.getElementById("auth-submit");
const authToggleLink = document.getElementById("auth-toggle-mode");
const authForgotPasswordLink = document.getElementById("auth-forgot-password");
const resetOverlay = document.getElementById("reset-overlay");
const resetForm = document.getElementById("reset-form");
const resetNewPassword = document.getElementById("reset-new-password");
const resetConfirmPassword = document.getElementById("reset-confirm-password");
const resetError = document.getElementById("reset-error");
const logoutBtn = document.getElementById("btn-logout");
const subscribeBtn = document.getElementById("btn-subscribe");
const paywallError = document.getElementById("paywall-error");
const userEmailLabel = document.getElementById("user-email");
const userMenuBtn = document.getElementById("user-menu-btn");
const userMenuDropdown = document.getElementById("user-menu-dropdown");
const menuLogoutBtn = document.getElementById("menu-logout");
const menuProfileBtn = document.getElementById("menu-profile");
const profileEmail = document.getElementById("profile-email");
const profilePasswordForm = document.getElementById("profile-password-form");
const profileNewPassword = document.getElementById("profile-new-password");
const profileConfirmPassword = document.getElementById("profile-confirm-password");
const profilePasswordMessage = document.getElementById("profile-password-message");
const btnProfileBack = document.getElementById("btn-profile-back");
const btnManageBilling = document.getElementById("btn-manage-billing");
const profileBillingMessage = document.getElementById("profile-billing-message");

function mensagemAmigavel(raw) {
  const m = (raw || "").toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "Confirme seu email antes de entrar. Verifique sua caixa de entrada.";
  if (m.includes("user already registered"))
    return "Este email já possui uma conta. Tente entrar ou recuperar a senha.";
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("unable to validate email address") || m.includes("invalid format"))
    return "O formato do email parece inválido. Verifique e tente novamente.";
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("429"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("auth session missing") || m.includes("session_not_found"))
    return "Sua sessão expirou. Faça login novamente.";
  if (m.includes("network") || m.includes("fetch") || m.includes("failed to fetch"))
    return "Problema de conexão. Verifique sua internet e tente novamente.";
  if (m.includes("timeout"))
    return "O servidor demorou para responder. Tente novamente em instantes.";
  if (m.includes("same password"))
    return "A nova senha não pode ser igual à senha atual.";
  if (m.includes("portal"))
    return "Não foi possível abrir o portal de assinatura. Tente novamente.";
  if (m.includes("checkout"))
    return "Não foi possível iniciar o pagamento. Tente novamente.";
  return "Algo deu errado. Tente novamente ou entre em contato com o suporte.";
}

let authMode = "login"; // "login" ou "signup"
let lastKnownUserEmail = "";
let currentView = null;
let appLoaded = false;

const APP_BODY_HTML = `
<aside id="palette">
  <div class="palette-col" id="col-pieces"></div>
  <div class="palette-col" id="col-bases"></div>
</aside>
<main id="stage-wrapper">
  <div id="stage-bg-container">
    <img id="stage-bg" src="assets/stage/palco.png" alt="Palco">
  </div>
  <svg id="connections-layer"></svg>
  <div id="items-layer"></div>
  <button id="trash" title="Arraste um item aqui para remover">
    <svg viewBox="0 0 24 24" width="22" height="22">
      <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  </button>
  <div id="zoom-control">
    <span id="zoom-label">Zoom palco: 100%</span>
    <div class="zoom-row">
      <button id="zoom-minus">-</button>
      <input type="range" id="zoom-slider" min="50" max="250" value="100">
      <button id="zoom-plus">+</button>
    </div>
  </div>
  <div id="top-bar">
    <button id="btn-save">Salvar (.json)</button>
    <label id="btn-load" class="file-btn">
      Carregar (.json)
      <input type="file" id="load-input" accept="application/json">
    </label>
  </div>
  <div id="help-bar">
    Arraste da paleta | Scroll sobre peca/base: redimensionar | Botao direito em peca: conectar |
    Clique numa linha: selecionar | Del / arraste p/ lixeira: remover | Duplo clique: rotular
  </div>
</main>
`;

async function ensureAppLoaded() {
  if (appLoaded) return;
  document.getElementById("app-body").innerHTML = APP_BODY_HTML;
  await new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "app.js";
    s.onload = resolve;
    document.body.appendChild(s);
  });
  appLoaded = true;
}

function showOnly(view) {
  loadingOverlay.classList.add("hidden");
  currentView = view;
  authOverlay.classList.toggle("hidden", view !== "auth");
  confirmOverlay.classList.toggle("hidden", view !== "confirm");
  resetOverlay.classList.toggle("hidden", view !== "reset");
  paywallOverlay.classList.toggle("hidden", view !== "paywall");
  profileOverlay.classList.toggle("hidden", view !== "profile");
  appRoot.classList.toggle("hidden", view !== "app");
  if (view === "auth") {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta";
  }
}

btnResend.addEventListener("click", async () => {
  confirmError.textContent = "";
  btnResend.disabled = true;
  btnResend.innerHTML = '<span class="spinner"></span>Enviando...';
  const email = btnResend.dataset.email || "";
  const { error } = await supabaseClient.auth.resend({ type: "signup", email });
  btnResend.disabled = false;
  btnResend.textContent = "Reenviar email";
  if (error) {
    confirmError.textContent = mensagemAmigavel(error.message);
  } else {
    confirmError.classList.add("form-success");
    confirmError.textContent = "Email reenviado. Verifique sua caixa de entrada.";
  }
});

btnBackToLogin.addEventListener("click", () => {
  authMode = "login";
  authModeLabel.textContent = "Entrar";
  authSubmitBtn.textContent = "Entrar";
  authToggleLink.textContent = "Nao tem conta? Criar uma";
  authError.textContent = "";
  authEmail.value = "";
  authPassword.value = "";
  showOnly("auth");
});

authToggleLink.addEventListener("click", (evt) => {
  evt.preventDefault();
  authMode = authMode === "login" ? "signup" : "login";
  authModeLabel.textContent = authMode === "login" ? "Entrar" : "Criar conta";
  authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta";
  authToggleLink.textContent =
    authMode === "login" ? "Nao tem conta? Criar uma" : "Ja tem conta? Entrar";
  authError.classList.remove("form-success");
  authError.textContent = "";
});

authForm.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  authError.classList.remove("form-success");
  authError.textContent = "";
  const email = authEmail.value.trim();
  const password = authPassword.value;

  const label = authMode === "login" ? "Entrando..." : "Criando conta...";
  authSubmitBtn.disabled = true;
  authSubmitBtn.innerHTML = `<span class="spinner"></span>${label}`;

  const { error } =
    authMode === "login"
      ? await supabaseClient.auth.signInWithPassword({ email, password })
      : await supabaseClient.auth.signUp({ email, password });

  if (error) {
    authError.textContent = mensagemAmigavel(error.message);
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta";
    return;
  }
  if (authMode === "signup") {
    const email = authEmail.value.trim();
    confirmEmailDesc.textContent = `Enviamos um link de confirmação para ${email}. Clique no link para ativar sua conta e então volte aqui para entrar.`;
    confirmError.textContent = "";
    btnResend.dataset.email = email;
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = "Criar conta";
    showOnly("confirm");
    return;
  }
  await refreshAccessState();
});

authForgotPasswordLink.addEventListener("click", async (evt) => {
  evt.preventDefault();
  authError.classList.remove("form-success");
  const email = authEmail.value.trim();
  if (!email) {
    authError.textContent = "Digite seu email no campo acima primeiro.";
    return;
  }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });
  if (error) {
    authError.textContent = mensagemAmigavel(error.message);
    return;
  }
  authError.classList.add("form-success");
  authError.textContent = "Email enviado. Verifique sua caixa de entrada para redefinir a senha.";
});

resetForm.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  resetError.textContent = "";
  if (resetNewPassword.value !== resetConfirmPassword.value) {
    resetError.textContent = "As senhas nao coincidem.";
    return;
  }
  const { error } = await supabaseClient.auth.updateUser({ password: resetNewPassword.value });
  if (error) {
    resetError.textContent = mensagemAmigavel(error.message);
    return;
  }
  resetNewPassword.value = "";
  resetConfirmPassword.value = "";
  currentView = null;
  await refreshAccessState();
});

async function handleLogout() {
  closeUserMenu();
  await supabaseClient.auth.signOut();
  await refreshAccessState();
}
logoutBtn.addEventListener("click", handleLogout);
menuLogoutBtn.addEventListener("click", handleLogout);

function closeUserMenu() {
  userMenuDropdown.classList.add("hidden");
  userMenuBtn.setAttribute("aria-expanded", "false");
}

userMenuBtn.addEventListener("click", (evt) => {
  evt.stopPropagation();
  const isOpen = !userMenuDropdown.classList.contains("hidden");
  userMenuDropdown.classList.toggle("hidden", isOpen);
  userMenuBtn.setAttribute("aria-expanded", String(!isOpen));
});

document.addEventListener("click", (evt) => {
  if (!document.getElementById("user-menu").contains(evt.target)) {
    closeUserMenu();
  }
});

const subStatus  = document.getElementById("sub-status");
const subRenewal = document.getElementById("sub-renewal");

async function carregarInfoAssinatura() {
  subStatus.textContent = "Carregando...";
  subStatus.className = "sub-value";
  subRenewal.textContent = "—";

  const { data: sessionData } = await supabaseClient.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return;

  const { data } = await supabaseClient
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    subStatus.textContent = "Sem assinatura";
    subStatus.className = "sub-value status-inactive";
    return;
  }

  const statusMap = {
    active:    { texto: "Ativa",       classe: "status-active"   },
    past_due:  { texto: "Vencida",     classe: "status-past-due" },
    canceled:  { texto: "Cancelada",   classe: "status-inactive" },
    inactive:  { texto: "Inativa",     classe: "status-inactive" },
  };
  const info = statusMap[data.status] ?? { texto: data.status, classe: "" };
  subStatus.textContent = info.texto;
  subStatus.className = `sub-value ${info.classe}`;

  if (data.current_period_end) {
    subRenewal.textContent = new Date(data.current_period_end).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } else {
    subRenewal.textContent = "—";
  }
}

menuProfileBtn.addEventListener("click", async () => {
  closeUserMenu();
  profileEmail.value = lastKnownUserEmail;
  profileNewPassword.value = "";
  profileConfirmPassword.value = "";
  profilePasswordMessage.classList.remove("form-success");
  profilePasswordMessage.textContent = "";
  profileBillingMessage.textContent = "";
  btnManageBilling.disabled = false;
  btnManageBilling.textContent = "Gerenciar assinatura no Stripe";
  showOnly("profile");
  await carregarInfoAssinatura();
});

btnProfileBack.addEventListener("click", () => {
  showOnly("app");
});

profilePasswordForm.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  profilePasswordMessage.textContent = "";
  profilePasswordMessage.classList.remove("form-success");
  if (profileNewPassword.value !== profileConfirmPassword.value) {
    profilePasswordMessage.textContent = "As senhas nao coincidem.";
    return;
  }
  const { error } = await supabaseClient.auth.updateUser({ password: profileNewPassword.value });
  if (error) {
    profilePasswordMessage.textContent = mensagemAmigavel(error.message);
    return;
  }
  profileNewPassword.value = "";
  profileConfirmPassword.value = "";
  profilePasswordMessage.classList.add("form-success");
  profilePasswordMessage.textContent = "Senha atualizada com sucesso.";
});

btnManageBilling.addEventListener("click", async () => {
  profileBillingMessage.textContent = "";
  btnManageBilling.disabled = true;
  btnManageBilling.innerHTML = '<span class="spinner"></span>Abrindo...';
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch(`${SUPABASE_CONFIG.functionsUrl}/create-portal-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();
    if (body.url) {
      window.location.href = body.url;
    } else {
      throw new Error(body.error || "portal");
    }
  } catch (err) {
    profileBillingMessage.textContent = mensagemAmigavel(String(err.message || err));
    btnManageBilling.disabled = false;
    btnManageBilling.textContent = "Gerenciar assinatura";
  }
});

subscribeBtn.addEventListener("click", async () => {
  paywallError.textContent = "";
  subscribeBtn.disabled = true;
  subscribeBtn.innerHTML = '<span class="spinner"></span>Redirecionando...';
  try {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch(`${SUPABASE_CONFIG.functionsUrl}/create-checkout-session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();
    if (body.url) {
      window.location.href = body.url;
    } else {
      throw new Error(body.error || "checkout");
    }
  } catch (err) {
    paywallError.textContent = mensagemAmigavel(String(err.message || err));
    subscribeBtn.disabled = false;
    subscribeBtn.textContent = "Assinar agora";
  }
});

async function hasActiveSubscription(userId) {
  const { data } = await supabaseClient
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const stillValid = !data.current_period_end || new Date(data.current_period_end) > new Date();
  return data.status === "active" && stillValid;
}

async function refreshAccessState() {
  if (currentView === "reset") return;
  const { data } = await supabaseClient.auth.getSession();
  if (currentView === "reset") return;
  const session = data.session;
  if (!session) {
    showOnly("auth");
    return;
  }
  const active = await hasActiveSubscription(session.user.id);
  if (currentView === "reset") return;
  if (active) {
    await ensureAppLoaded();
    lastKnownUserEmail = session.user.email;
    userEmailLabel.textContent = session.user.email;
    closeUserMenu();
    if (currentView !== "profile") {
      showOnly("app");
    }
  } else {
    subscribeBtn.disabled = false;
    subscribeBtn.textContent = "Assinar agora";
    showOnly("paywall");
  }
}

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    resetError.textContent = "";
    showOnly("reset");
    return;
  }
  refreshAccessState();
});

refreshAccessState();
