<template>
  <div class="app">
    <header class="header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">📚</span>
          <span class="logo-text">智慧学堂</span>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link" exact-active-class="active">首页</router-link>
          <router-link to="/courses" class="nav-link" active-class="active">课程中心</router-link>
          <router-link to="/study" class="nav-link" active-class="active" v-if="user">学习中心</router-link>
        </nav>
        <div class="user-area">
          <template v-if="user">
            <router-link to="/profile" class="user-info">
              <img :src="user.avatar" class="avatar" alt="avatar" />
              <span class="username">{{ user.username }}</span>
            </router-link>
            <button class="btn btn-outline" @click="logout">退出</button>
          </template>
          <template v-else>
            <button class="btn btn-outline" @click="showLogin = true">登录</button>
            <button class="btn btn-primary" @click="showRegister = true">注册</button>
          </template>
        </div>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div class="container">
        <p>© 2024 智慧学堂 - 在线教育平台</p>
      </div>
    </footer>

    <div v-if="showLogin" class="modal-mask" @click.self="showLogin = false">
      <div class="modal">
        <h2>用户登录</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="loginForm.username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="loginForm.password" type="password" placeholder="请输入密码" required />
          </div>
          <p class="tip">测试账号: demo / 123456</p>
          <button type="submit" class="btn btn-primary btn-block">登录</button>
        </form>
        <p class="switch-text" @click="showLogin = false; showRegister = true">还没有账号？立即注册</p>
      </div>
    </div>

    <div v-if="showRegister" class="modal-mask" @click.self="showRegister = false">
      <div class="modal">
        <h2>用户注册</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="registerForm.username" type="text" placeholder="请输入用户名" required />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="registerForm.email" type="email" placeholder="请输入邮箱" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="registerForm.password" type="password" placeholder="请输入密码" required />
          </div>
          <button type="submit" class="btn btn-primary btn-block">注册</button>
        </form>
        <p class="switch-text" @click="showRegister = false; showLogin = true">已有账号？立即登录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from './utils/request'

const router = useRouter()
const user = ref(null)
const showLogin = ref(false)
const showRegister = ref(false)
const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })

onMounted(() => {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    user.value = JSON.parse(savedUser)
  }
})

const handleLogin = async () => {
  try {
    const res = await request.post('/users/login', loginForm.value)
    user.value = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
    showLogin.value = false
    loginForm.value = { username: '', password: '' }
    alert('登录成功！')
  } catch (err) {
    alert(err.response?.data?.message || '登录失败')
  }
}

const handleRegister = async () => {
  try {
    const res = await request.post('/users/register', registerForm.value)
    alert('注册成功！请登录')
    showRegister.value = false
    showLogin.value = true
    registerForm.value = { username: '', email: '', password: '' }
  } catch (err) {
    alert(err.response?.data?.message || '注册失败')
  }
}

const logout = () => {
  user.value = null
  localStorage.removeItem('user')
  router.push('/')
}
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
}
</style>
