<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      @click.self="close"
    >
      <div
        ref="modalRef"
        class="bg-surface-overlay rounded-modal shadow-e4 w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
      >
        <!-- Close button -->
        <button
          class="absolute top-4 right-4 p-2 rounded-full text-content-muted hover:text-content-strong hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          :aria-label="t('aria.closeAccount')"
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
        <h2
          id="account-modal-title"
          class="text-2xl font-bold mb-6 text-content-strong"
        >
          {{ t('account.title') }}
        </h2>

        <!-- Global messages -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-4 p-3 bg-danger/15 border border-danger/40 text-red-300 rounded-control"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          role="status"
          class="mb-4 p-3 bg-success/15 border border-success/40 text-emerald-300 rounded-control"
        >
          {{ successMessage }}
        </div>

        <!-- Username section -->
        <section class="mb-8">
          <h3 class="text-lg font-semibold mb-3 text-content-strong">
            {{ t('account.profileSection') }}
          </h3>
          <form @submit.prevent="submitUsername">
            <label
              for="account-username"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('account.newUsername') }}
            </label>
            <input
              id="account-username"
              v-model="usernameForm"
              type="text"
              required
              class="w-full px-3 py-2 mb-3 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            <button
              type="submit"
              :disabled="loadingUsername"
              class="w-full bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold py-2.5 px-4 rounded-control transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {{ loadingUsername ? t('account.saving') : t('account.saveUsername') }}
            </button>
          </form>
        </section>

        <!-- Password section -->
        <section class="mb-8 pt-6 border-t border-surface-border">
          <h3 class="text-lg font-semibold mb-3 text-content-strong">
            {{ t('account.passwordSection') }}
          </h3>
          <form @submit.prevent="submitPassword">
            <label
              for="account-current-pw"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('account.currentPassword') }}
            </label>
            <input
              id="account-current-pw"
              v-model="passwordForm.current"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2 mb-3 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            <label
              for="account-new-pw"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('account.newPassword') }}
            </label>
            <input
              id="account-new-pw"
              v-model="passwordForm.next"
              type="password"
              required
              autocomplete="new-password"
              class="w-full px-3 py-2 mb-3 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            <button
              type="submit"
              :disabled="loadingPassword"
              class="w-full bg-pokedex-red hover:bg-pokedex-red-dark text-white font-semibold py-2.5 px-4 rounded-control transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {{ loadingPassword ? t('account.saving') : t('account.savePassword') }}
            </button>
          </form>
        </section>

        <!-- Danger zone -->
        <section class="pt-6 border-t border-danger/40">
          <h3 class="text-lg font-semibold mb-3 text-danger">
            {{ t('account.dangerSection') }}
          </h3>
          <p class="text-sm text-content-muted mb-3">
            {{ t('account.dangerWarning') }}
          </p>
          <form @submit.prevent="submitDelete">
            <label
              for="account-delete-pw"
              class="block text-sm font-medium text-content-muted mb-2"
            >
              {{ t('account.confirmPassword') }}
            </label>
            <input
              id="account-delete-pw"
              v-model="deletePassword"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2 mb-3 bg-surface-hover border border-surface-border text-content-strong rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            <button
              type="submit"
              :disabled="loadingDelete"
              class="w-full bg-danger hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-control transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {{ loadingDelete ? t('account.deleting') : t('account.deleteButton') }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useTranslation } from "@/composables/useTranslation";
import { useFocusTrap } from "@/composables/useFocusTrap";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [];
}>();

const { user, updateProfile, changePassword, deleteAccount } = useAuth();
const { t } = useTranslation();

const errorMessage = ref("");
const successMessage = ref("");

const usernameForm = ref("");
const loadingUsername = ref(false);

const passwordForm = reactive({ current: "", next: "" });
const loadingPassword = ref(false);

const deletePassword = ref("");
const loadingDelete = ref(false);

// Focus trap
const modalRef = ref<HTMLElement | null>(null);
const isOpenRef = ref(false);
useFocusTrap(modalRef, isOpenRef, () => emit("close"));

const resetMessages = () => {
  errorMessage.value = "";
  successMessage.value = "";
};

const resetForms = () => {
  usernameForm.value = user.value?.username ?? "";
  passwordForm.current = "";
  passwordForm.next = "";
  deletePassword.value = "";
  loadingUsername.value = false;
  loadingPassword.value = false;
  loadingDelete.value = false;
  resetMessages();
};

watch(
  () => props.isOpen,
  (open) => {
    isOpenRef.value = open;
    if (open) {
      resetForms();
    }
  },
  { immediate: true }
);

const close = () => {
  emit("close");
};

const submitUsername = async () => {
  resetMessages();
  loadingUsername.value = true;
  try {
    const result = await updateProfile(usernameForm.value);
    if (result.success) {
      successMessage.value = t("account.usernameUpdated");
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } finally {
    loadingUsername.value = false;
  }
};

const submitPassword = async () => {
  resetMessages();
  loadingPassword.value = true;
  try {
    const result = await changePassword(passwordForm.current, passwordForm.next);
    if (result.success) {
      successMessage.value = t("account.passwordUpdated");
      passwordForm.current = "";
      passwordForm.next = "";
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } finally {
    loadingPassword.value = false;
  }
};

const submitDelete = async () => {
  resetMessages();
  loadingDelete.value = true;
  try {
    const result = await deleteAccount(deletePassword.value);
    if (result.success) {
      emit("deleted");
      emit("close");
    } else {
      errorMessage.value = result.error || "An error occurred";
    }
  } finally {
    loadingDelete.value = false;
  }
};
</script>
