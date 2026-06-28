"use strict";

/* ----------------------------------------------------------------
   Autenticacao (Supabase) + paywall (assinatura via Stripe)
   Carrega antes de app.js e controla quando o palco fica visivel.
   ---------------------------------------------------------------- */

const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
);

const authOverlay = document.getElementById("auth-overlay");
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

let authMode = "login"; // "login" ou "signup"
let lastKnownUserEmail = "";
let currentView = null;

function showOnly(view) {
  currentView = view;
  authOverlay.classList.toggle("hidden", view !== "auth");
  paywallOverlay.classList.toggle("hidden", view !== "paywall");
  profileOverlay.classList.toggle("hidden", view !== "profile");
  appRoot.classList.toggle("hidden", view !== "app");
}

authToggleLink.addEventListener("click", (evt) => {
  evt.preventDefault();
  authMode = authMode === "login" ? "signup" : "login";
  authModeLabel.textContent = authMode === "login" ? "Entrar" : "Criar conta";
  authSubmitBtn.textContent = authMode === "login" ? "Entrar" : "Criar conta";
  authToggleLink.textContent =
    authMode === "login" ? "Nao tem conta? Criar uma" : "Ja tem conta? Entrar";
  authError.textContent = "";
});

authForm.addEventListener("submit", async (evt) => {
  evt.preventDefault();
  authError.textContent = "";
  const email = authEmail.value.trim();
  const password = authPassword.value;

  const { error } =
    authMode === "login"
      ? await supabaseClient.auth.signInWithPassword({ email, password })
      : await supabaseClient.auth.signUp({ email, password });

  if (error) {
    authError.textContent = error.message;
    return;
  }
  if (authMode === "signup") {
    authError.textContent = "Conta criada. Verifique seu email para confirmar o login.";
    return;
  }
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

menuProfileBtn.addEventListener("click", () => {
  closeUserMenu();
  profileEmail.value = lastKnownUserEmail;
  profileNewPassword.value = "";
  profileConfirmPassword.value = "";
  profilePasswordMessage.classList.remove("form-success");
  profilePasswordMessage.textContent = "";
  profileBillingMessage.textContent = "";
  btnManageBilling.disabled = false;
  btnManageBilling.textContent = "Gerenciar assinatura";
  showOnly("profile");
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
    profilePasswordMessage.textContent = error.message;
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
  btnManageBilling.textContent = "Abrindo...";
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
      throw new Error(body.error || "Nao foi possivel abrir o portal de assinatura.");
    }
  } catch (err) {
    profileBillingMessage.textContent = String(err.message || err);
    btnManageBilling.disabled = false;
    btnManageBilling.textContent = "Gerenciar assinatura";
  }
});

subscribeBtn.addEventListener("click", async () => {
  paywallError.textContent = "";
  subscribeBtn.disabled = true;
  subscribeBtn.textContent = "Redirecionando...";
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
      throw new Error(body.error || "Nao foi possivel iniciar o checkout.");
    }
  } catch (err) {
    paywallError.textContent = String(err.message || err);
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
  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;
  if (!session) {
    showOnly("auth");
    return;
  }
  const active = await hasActiveSubscription(session.user.id);
  if (active) {
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

supabaseClient.auth.onAuthStateChange(() => {
  refreshAccessState();
});

refreshAccessState();
