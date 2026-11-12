<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      @click.self="close"
    >
      <div
        ref="modalRef"
        class="bg-surface-overlay rounded-modal shadow-e4 w-full max-w-md p-6 relative"
      >
        <!-- Close button -->
        <button
          class="absolute top-4 right-4 p-2 rounded-full text-content-muted hover:text-content-strong hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          :aria-label="t('aria.closeAuth')"
          @click="close"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Title -->
        <h2 id="auth-modal-title" class="text-2xl font-bold mb-6 text-content-strong">
          {{
            step === 'verify'
              ? t('auth.verifyTitle')
              : mode === "login" ? t('auth.login') : t('auth.register')
          }}
        </h2>

        <!-- Error message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-4 p-3 bg-danger/15 border border-danger/40 text-red-300 rounded-control"
        >
          {{ errorMessage }}
        </div>

        <!-- Success / info message -->
        <div
          v-if="infoMessage"
          role="status"
          class="mb-4 p-3 bg-success/15 border border-success/40 text-emerald-300 rounded-control"
        >
          {{ infoMessage }}
        </div>

        <!-- Verification step -->
        <form v-if="step === 'verify'" @submit.prevent="submitVerify">
          <p class="mb-4 text-sm text-content-muted">
            {{ t('auth.verifyIntro', { email: pendingEmail }) }}
          </p>
          <div class="mb-6">
            <label
              for="verify-code"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('auth.verifyCode') }}
            </label>
            <input
              id="verify-code"
              v-model="verifyCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              required
              maxlength="6"
              class="w-full px-3 py-2 tracking-[0.5em] text-center text-lg bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold py-2.5 px-4 rounded-control transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {{ loading ? t('auth.loading') : t('auth.verifyButton') }}
          </button>

          <div class="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              class="text-content-muted hover:text-content-strong underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded"
              @click="backToLogin"
            >
              {{ t('auth.backToLogin') }}
            </button>
            <button
              type="button"
              :disabled="resendSeconds > 0 || loading"
              class="text-pokedex-red hover:text-pokedex-red-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed underline-offset-2 hover:enabled:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded"
              @click="submitResend"
            >
              {{ resendSeconds > 0 ? t('auth.resendCooldown', { seconds: String(resendSeconds) }) : t('auth.resend') }}
            </button>
          </div>
        </form>

        <!-- Form -->
        <form v-else @submit.prevent="submit">
          <!-- Username (register only) -->
          <div v-if="mode === 'register'" class="mb-4">
            <label
              for="username"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('auth.username') }}
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="w-full px-3 py-2 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label
              for="email"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('auth.email') }}
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="w-full px-3 py-2 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label
              for="password"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('auth.password') }}
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold py-2.5 px-4 rounded-control transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {{
              loading
                ? t('auth.loading')
                : mode === "login"
                ? t('auth.loginButton')
                : t('auth.registerButton')
            }}
          </button>
        </form>

        <!-- Toggle mode -->
        <div v-if="step === 'form'" class="mt-4 text-center text-sm text-content-muted">
          <button
            class="text-pokedex-red hover:text-pokedex-red-dark font-medium underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded"
            @click="toggleMode"
          >
            {{
              mode === "login"
                ? t('auth.noAccount')
                : t('auth.hasAccount')
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from "vue";
import { useAuth } from "../composables/useAuth";
import { useTranslation } from "@/composables/useTranslation";
import { useFocusTrap } from "@/composables/useFocusTrap";

const props = defineProps<{
  isOpen: boolean;
  initialMode?: "login" | "register";
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const { login, register, verifyEmail, resendVerification } = useAuth();
const { t } = useTranslation();

const mode = ref<"login" | "register">(props.initialMode || "login");
const step = ref<"form" | "verify">("form");
const loading = ref(false);
const errorMessage = ref("");
const infoMessage = ref("");

const pendingEmail = ref("");
const verifyCode = ref("");
const resendSeconds = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;

// Focus trap
const modalRef = ref<HTMLElement | null>(null);
const isOpenRef = ref(false);
useFocusTrap(modalRef, isOpenRef, () => emit("close"));

watch(() => props.isOpen, (newVal) => {
  isOpenRef.value = newVal;
}, { immediate: true });

const formData = reactive({
  username: "",
  email: "",
  password: "",
});

const startResendCooldown = (seconds = 60) => {
  resendSeconds.value = seconds;
  if (resendTimer) clearInterval(resendTimer);
  resendTimer = setInterval(() => {
    resendSeconds.value -= 1;
    if (resendSeconds.value <= 0 && resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }, 1000);
};

const goToVerify = (email: string) => {
  pendingEmail.value = email;
  step.value = "verify";
  verifyCode.value = "";
  errorMessage.value = "";
  startResendCooldown();
};

const backToLogin = () => {
  step.value = "form";
  mode.value = "login";
  errorMessage.value = "";
  infoMessage.value = "";
  verifyCode.value = "";
};

const toggleMode = () => {
  mode.value = mode.value === "login" ? "register" : "login";
  errorMessage.value = "";
  infoMessage.value = "";
};

const close = () => {
  emit("close");
  resetForm();
};

const resetForm = () => {
  formData.username = "";
  formData.email = "";
  formData.password = "";
  errorMessage.value = "";
  infoMessage.value = "";
  loading.value = false;
  step.value = "form";
  pendingEmail.value = "";
  verifyCode.value = "";
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }
  resendSeconds.value = 0;
};

const submit = async () => {
  loading.value = true;
  errorMessage.value = "";
  infoMessage.value = "";

  try {
    let result;
    if (mode.value === "login") {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(
        formData.username,
        formData.email,
        formData.password
      );
    }

    if (result.success) {
      // Registration now requires email verification before session.
      if ("needsVerification" in result && result.needsVerification) {
        goToVerify(result.email as string);
      } else {
        emit("success");
        close();
      }
    } else if ("needsVerification" in result && result.needsVerification) {
      // Login blocked because email not verified yet.
      goToVerify(result.email as string);
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } catch {
    errorMessage.value = "An error occurred";
  } finally {
    loading.value = false;
  }
};

const submitVerify = async () => {
  loading.value = true;
  errorMessage.value = "";
  infoMessage.value = "";

  try {
    const result = await verifyEmail(pendingEmail.value, verifyCode.value);
    if (result.success) {
      emit("success");
      close();
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } catch {
    errorMessage.value = "An error occurred";
  } finally {
    loading.value = false;
  }
};

const submitResend = async () => {
  if (resendSeconds.value > 0) return;
  loading.value = true;
  errorMessage.value = "";
  infoMessage.value = "";

  try {
    const result = await resendVerification(pendingEmail.value);
    if (result.success) {
      infoMessage.value = t("auth.resent");
      startResendCooldown();
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } catch {
    errorMessage.value = "An error occurred";
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isOpen,
  (newValue) => {
    if (!newValue) {
      resetForm();
    }
  }
);

onUnmounted(() => {
  if (resendTimer) clearInterval(resendTimer);
});
</script>
