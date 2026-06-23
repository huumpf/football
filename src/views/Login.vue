<template>
  <div class="auth-page">
    <form class="card auth-card" @submit.prevent="submit">
      <h1 class="headline auth-title">{{ isRegister ? 'Create account' : 'Sign in' }}</h1>

      <label class="field">
        <span class="field-label">Email</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="field-input"
        />
      </label>

      <label class="field">
        <span class="field-label">Password</span>
        <input
          v-model="password"
          type="password"
          :autocomplete="isRegister ? 'new-password' : 'current-password'"
          required
          class="field-input"
        />
      </label>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <Button class="auth-submit" type="submit" :disabled="busy">
        {{ busy ? 'Please wait…' : (isRegister ? 'Create account' : 'Sign in') }}
      </Button>

      <button type="button" class="auth-toggle" @click="toggleMode">
        {{ isRegister ? 'Have an account? Sign in' : 'Need an account? Create one' }}
      </button>
    </form>
  </div>
</template>

<script>
import Button from '@/components/Button.vue';

const MESSAGES = {
  invalid_email: 'Please enter a valid email address.',
  weak_password: 'Password must be at least 8 characters.',
  email_taken: 'That email is already registered.',
  invalid_credentials: 'Wrong email or password.',
};

export default {
  name: 'Login',

  components: { Button },

  inject: ['persistence'],

  data() {
    return {
      mode: 'login',
      email: '',
      password: '',
      error: '',
      busy: false,
    };
  },

  computed: {
    isRegister() {
      return this.mode === 'register';
    },
  },

  methods: {
    toggleMode() {
      this.mode = this.isRegister ? 'login' : 'register';
      this.error = '';
    },

    async submit() {
      if (this.busy) return;
      this.busy = true;
      this.error = '';

      try {
        const action = this.isRegister ? 'auth/register' : 'auth/login';
        await this.$store.dispatch(action, { email: this.email, password: this.password });
      } catch (e) {
        this.error = MESSAGES[e.code] || 'Something went wrong. Please try again.';
        this.busy = false;
        return;
      }

      // Auth succeeded; loading the save is a separate phase. If it fails, roll
      // back to signed-out so the user isn't stranded authenticated on /login.
      try {
        await this.persistence.resume();
        // Draft.vue forwards a returning manager to the team once the squad is
        // complete, so we can always land on the start route.
        this.$router.replace({ name: 'Draft' });
      } catch (e) {
        this.$store.commit('auth/SET_USER', null);
        this.error = 'Signed in, but could not load your saved game. Please try again.';
        this.busy = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
}

.auth-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 360px;
  text-align: left;
}

.auth-title {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: $col_text_faded;
}

.field-input {
  padding: 10px 12px;
  border: 1px solid $col_module_background_faded;
  border-radius: 8px;
  background-color: $col_page_background;
  color: $col_text;
  font-family: inherit;
  font-size: 15px;
}

.field-input:focus {
  outline: none;
  border-color: $col_text_faded;
}

.auth-error {
  color: #e5534b;
  font-size: 13px;
}

.auth-submit {
  align-self: stretch;
  border-color: $col_module_background_faded;
}

.auth-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.auth-toggle {
  background: none;
  border: none;
  color: $col_text_faded;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
}

.auth-toggle:hover {
  color: $col_text;
}
</style>
