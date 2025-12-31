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
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
      >
        <!-- Close button -->
        <button
          @click="close"
          class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :aria-label="t('aria.closeAuth')"
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
        <h2 id="auth-modal-title" class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {{ mode === "login" ? t('auth.login') : t('auth.register') }}
        </h2>

        <!-- Error message -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {{ errorMessage }}
        </div>

        <!-- Form -->
        <form @submit.prevent="submit">
          <!-- Username (register only) -->
          <div v-if="mode === 'register'" class="mb-4">
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('auth.username') }}
            </label>
            <input
              id="username"
              v-model="formData.username"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <!-- Email -->
          <div class="mb-4">
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('auth.email') }}
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <!-- Password -->
          <div class="mb-6">
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('auth.password') }}
            </label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <button
            @click="toggleMode"
            class="text-blue-500 hover:text-blue-600 font-medium"
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
import { ref, reactive, watch } from "vue";
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

const { login, register } = useAuth();
const { t } = useTranslation();

const mode = ref<"login" | "register">(props.initialMode || "login");
const loading = ref(false);
const errorMessage = ref("");

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

const toggleMode = () => {
  mode.value = mode.value === "login" ? "register" : "login";
  errorMessage.value = "";
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
  loading.value = false;
};

const submit = async () => {
  loading.value = true;
  errorMessage.value = "";

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
      emit("success");
      close();
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } catch (error) {
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
</script>
