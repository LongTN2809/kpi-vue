<script setup>
import {ref} from 'vue'
import { supabase } from '@/lib/supabase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const router = useRouter();
const handleLogin = async () => {
    errorMessage.value = '';

    const cleanEmail = email.value.trim();

    // 1. Kiểm tra email
    if (!cleanEmail) {
        errorMessage.value = 'Vui lòng nhập email';
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errorMessage.value = 'Email không đúng định dạng';
        return;
    }

    // 2. Kiểm tra mật khẩu
    if (!password.value) {
        errorMessage.value = 'Vui lòng nhập mật khẩu';
        return;
    }

    // 3. Tránh gửi yêu cầu đăng nhập nhiều lần
    if (isLoading.value) return;
    isLoading.value = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password.value
        });

        if (error) {
            errorMessage.value = 'Email hoặc mật khẩu không chính xác';
            return;
        }

        // Đăng nhập thành công
        console.log(data.user);
        router.push('/');

    } catch (error) {
        console.error(error);
        errorMessage.value = 'Có lỗi xảy ra, vui lòng thử lại';
    } finally {
        isLoading.value = false;
    }
};

const handleTogglePassword = () => {
   let inpPassword = document.querySelector('.password');
 if(inpPassword.type === 'password') inpPassword.type = 'text';
 else inpPassword.type = 'password';
}
</script>

<template>
   <main class="login-wrapper">
      <form action="" class="login-form">
         <header class="login-title">
           <h2>Login</h2>
         </header>

         <div class="field-group">
<label for="email">Email</label>
<input v-model="email" type="email" name="email" class="email" id="email" required>
         </div>
         <div class="field-group">
<label for="password">Password</label>
<input v-model="password" type="password" name="password" class="password" id="password" required>
<i @click="handleTogglePassword" class="fa-solid fa-eye-slash"></i>
         </div>
         <div class="login-actions">          
      <label class="remember-me">
        <input type="checkbox" class="remember-check-box" name="remember">
        Remember me
      </label>

       <button class="btn" @click="handleLogin" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>

       
    </div>
     <p v-if="errorMessage" style="color: red; text-align: center; margin-top: 20px;"> {{ errorMessage }}</p>
      </form>
   </main>
   
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: var(--color-bg-soft);
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.login-title {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-title h2 {
  margin: 0;
  color: var(--color-primary);
}

.field-group {
   position: relative;
  margin-bottom: 1rem;
}

.login-actions {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.login-actions .btn {
  width: 120px;
  margin: 0 auto;
  transition: background .5s ease;
}

.login-actions .btn:hover{
    background-color:lightskyblue;
}

/* Remember me */
.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--color-text-light);
  cursor: pointer;
}

/* Bắt buộc: base.css đang set input { width: 100% } cho mọi input,
   nếu không ghi đè thì checkbox sẽ bị kéo giãn ra rất xấu */
.remember-me input[type="checkbox"] {
  width: auto;
  accent-color: var(--color-primary);
}
.fa-eye-slash{
   position: absolute;
   right:15px;
   top: 50%;
   transform: translateY(50%);
   cursor: pointer;
}
</style>