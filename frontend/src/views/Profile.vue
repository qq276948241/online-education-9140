<template>
  <div class="profile">
    <div class="profile-header">
      <div class="container">
        <div class="profile-info">
          <img :src="user?.avatar" class="profile-avatar" :alt="user?.username" />
          <div>
            <h1 class="profile-name">{{ user?.username }}</h1>
            <p style="opacity: 0.9;">{{ user?.bio || '这个人很懒，什么都没留下...' }}</p>
            <div class="profile-stats">
              <div class="stat-item">
                <div class="stat-value">{{ coursesCount }}</div>
                <div class="stat-label">已购课程</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ completedCount }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ordersCount }}</div>
                <div class="stat-label">订单数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ commentCount }}</div>
                <div class="stat-label">评价数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container" style="padding-bottom: 48px;">
      <div v-if="!user" class="empty-state">
        <div class="empty-icon">🔒</div>
        <p class="empty-text">请先登录后查看个人中心</p>
      </div>

      <template v-else>
        <div class="tab-nav" style="margin-bottom: 24px;">
          <div class="tab-item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">个人信息</div>
          <div class="tab-item" :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'; loadOrders()">我的订单</div>
          <div class="tab-item" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'; loadCourses()">我的课程</div>
        </div>

        <div v-if="activeTab === 'info'" class="profile-section">
          <h3>👤 基本信息</h3>
          <div class="form-row">
            <label>用户名</label>
            <input v-model="editForm.username" disabled />
          </div>
          <div class="form-row">
            <label>邮箱</label>
            <input v-model="editForm.email" disabled />
          </div>
          <div class="form-row">
            <label>个人简介</label>
            <textarea v-model="editForm.bio" rows="3" placeholder="介绍一下自己吧..."></textarea>
          </div>
          <div class="form-row">
            <label>注册时间</label>
            <input :value="formatTime(user.created_at)" disabled />
          </div>
          <div style="text-align: right; margin-top: 20px;">
            <button class="btn btn-primary" @click="saveProfile">💾 保存修改</button>
          </div>
        </div>

        <div v-if="activeTab === 'orders'">
          <div class="profile-section">
            <h3>📦 订单记录</h3>
            <div v-if="orders.length">
              <div v-for="order in orders" :key="order.id" class="order-item">
                <img :src="order.cover" :alt="order.title" />
                <div class="order-info">
                  <div class="order-title">{{ order.title }}</div>
                  <div class="order-time">
                    订单号: {{ order.order_no }} · {{ formatTime(order.created_at) }}
                  </div>
                </div>
                <span class="order-amount">¥{{ order.amount }}</span>
                <span class="order-status">{{ order.status === 'paid' ? '已支付' : '待支付' }}</span>
              </div>
            </div>
            <div v-else class="empty-state" style="padding: 40px 20px;">
              <div class="empty-icon" style="font-size: 48px;">📦</div>
              <p class="empty-text">暂无订单记录</p>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'courses'">
          <div class="profile-section">
            <h3>📚 已购课程</h3>
            <div v-if="myCourses.length" class="course-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
              <CourseCard v-for="course in myCourses" :key="course.id" :course="course" />
            </div>
            <div v-else class="empty-state" style="padding: 40px 20px;">
              <div class="empty-icon" style="font-size: 48px;">📚</div>
              <p class="empty-text">暂无已购课程</p>
              <router-link to="/courses" class="btn btn-primary" style="margin-top: 16px;">去选课</router-link>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request'
import CourseCard from '../components/CourseCard.vue'

const user = ref(null)
const editForm = ref({ username: '', email: '', bio: '' })
const activeTab = ref('info')
const orders = ref([])
const myCourses = ref([])
const ordersCount = ref(0)
const commentCount = ref(0)

const coursesCount = computed(() => myCourses.value.length)
const completedCount = computed(() => {
  return myCourses.value.filter(c => c.progress >= 100).length
})

const loadUserInfo = async () => {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return
  
  const parsedUser = JSON.parse(savedUser)
  try {
    const res = await request.get(`/users/${parsedUser.id}`)
    user.value = res.data
    editForm.value = {
      username: res.data.username,
      email: res.data.email,
      bio: res.data.bio || ''
    }
  } catch (err) {
    user.value = parsedUser
    editForm.value = {
      username: parsedUser.username,
      email: parsedUser.email,
      bio: parsedUser.bio || ''
    }
  }
}

const loadOrders = async () => {
  if (!user.value) return
  try {
    const res = await request.get(`/users/${user.value.id}/orders?pageSize=100`)
    orders.value = res.data.list
    ordersCount.value = res.data.total
  } catch (err) {
    console.error('加载订单失败:', err)
  }
}

const loadCourses = async () => {
  if (!user.value) return
  try {
    const res = await request.get(`/users/${user.value.id}/my-courses`)
    myCourses.value = res.data
  } catch (err) {
    console.error('加载课程失败:', err)
  }
}

const saveProfile = async () => {
  try {
    await request.put(`/users/${user.value.id}`, {
      bio: editForm.value.bio
    })
    user.value.bio = editForm.value.bio
    localStorage.setItem('user', JSON.stringify(user.value))
    alert('保存成功！')
  } catch (err) {
    alert('保存失败: ' + (err.response?.data?.message || err.message))
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadUserInfo()
})
</script>
