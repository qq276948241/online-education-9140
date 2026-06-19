<template>
  <div class="study">
    <div class="container" style="padding-top: 24px;">
      <h1 style="margin-bottom: 24px; font-size: 28px;">📖 学习中心</h1>

      <div v-if="!user" class="empty-state">
        <div class="empty-icon">🔒</div>
        <p class="empty-text">请先登录后查看学习中心</p>
        <button class="btn btn-primary" style="margin-top: 16px;" @click="goLogin">去登录</button>
      </div>

      <template v-else>
        <div class="profile-section" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img :src="user.avatar" class="avatar" style="width: 64px; height: 64px;" :alt="user.username" />
            <div>
              <h2 style="font-size: 20px; margin-bottom: 4px;">{{ user.username }}</h2>
              <p style="color: var(--text-muted); font-size: 14px;">已学习 {{ myCourses.length }} 门课程</p>
            </div>
          </div>
          <div style="display: flex; gap: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: var(--primary);">{{ completedCount }}</div>
              <div style="font-size: 13px; color: var(--text-muted);">已完成</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: var(--warning);">{{ inProgressCount }}</div>
              <div style="font-size: 13px; color: var(--text-muted);">学习中</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: var(--success);">{{ totalMinutes }}</div>
              <div style="font-size: 13px; color: var(--text-muted);">学习分钟</div>
            </div>
          </div>
        </div>

        <div class="tab-nav" style="margin-bottom: 24px;">
          <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部课程</div>
          <div class="tab-item" :class="{ active: activeTab === 'progress' }" @click="activeTab = 'progress'">学习中</div>
          <div class="tab-item" :class="{ active: activeTab === 'done' }" @click="activeTab = 'done'">已完成</div>
          <div class="tab-item" :class="{ active: activeTab === 'records' }" @click="activeTab = 'records'; loadRecords()">最近学习</div>
        </div>

        <div v-if="activeTab !== 'records'">
          <div v-if="filteredCourses.length">
            <div
              v-for="course in filteredCourses"
              :key="course.id"
              class="study-card"
              style="margin-bottom: 16px;"
            >
              <img :src="course.cover" :alt="course.title" @click="goToCourse(course.id)" style="cursor: pointer;" />
              <div class="study-info">
                <h3 @click="goToCourse(course.id)" style="cursor: pointer;">{{ course.title }}</h3>
                <div class="course-meta" style="margin-bottom: 8px;">
                  <span class="course-meta-item">👨‍🏫 {{ course.instructor }}</span>
                  <span class="course-meta-item">⭐ {{ course.rating }}</span>
                  <span class="course-meta-item" :style="{ color: getCourseProgress(course.id) >= 100 ? 'var(--success)' : 'var(--primary)' }">
                    {{ getCourseProgress(course.id) >= 100 ? '✅ 已完成' : '📖 学习中' }}
                  </span>
                </div>
                <div class="study-progress">
                  <div class="progress-bar" style="max-width: 400px;">
                    <div class="progress-fill" :style="{ width: getCourseProgress(course.id) + '%' }"></div>
                  </div>
                  <span class="study-progress-text">{{ getCourseProgress(course.id) }}%</span>
                </div>
              </div>
              <button class="btn btn-primary" @click="goToCourse(course.id)">
                {{ getCourseProgress(course.id) > 0 ? '继续学习' : '开始学习' }}
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">📚</div>
            <p class="empty-text">暂无{{ activeTab === 'progress' ? '学习中' : activeTab === 'done' ? '已完成' : '' }}课程</p>
            <router-link to="/courses" class="btn btn-primary" style="margin-top: 16px;">去选课</router-link>
          </div>
        </div>

        <div v-else>
          <div v-if="studyRecords.length">
            <div
              v-for="record in studyRecords"
              :key="record.id"
              class="study-card"
              style="margin-bottom: 16px;"
              @click="goToCourse(record.course_id)"
            >
              <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="font-size: 48px;">🎬</div>
                  <div>
                    <h3 style="font-size: 16px; margin-bottom: 4px;">{{ record.chapter_title }}</h3>
                    <p style="font-size: 14px; color: var(--text-muted);">{{ record.course_title }}</p>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                      上次学习: {{ formatTime(record.last_watched_at) }} · 进度: {{ record.progress }}%
                    </p>
                  </div>
                </div>
                <div class="progress-bar" style="width: 150px;">
                  <div class="progress-fill" :style="{ width: record.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">⏰</div>
            <p class="empty-text">暂无学习记录</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const router = useRouter()
const user = computed(() => {
  const saved = localStorage.getItem('user')
  return saved ? JSON.parse(saved) : null
})

const myCourses = ref([])
const progressMap = ref({})
const studyRecords = ref([])
const activeTab = ref('all')

const filteredCourses = computed(() => {
  if (activeTab.value === 'progress') {
    return myCourses.value.filter(c => getCourseProgress(c.id) < 100)
  }
  if (activeTab.value === 'done') {
    return myCourses.value.filter(c => getCourseProgress(c.id) >= 100)
  }
  return myCourses.value
})

const completedCount = computed(() => {
  return myCourses.value.filter(c => getCourseProgress(c.id) >= 100).length
})

const inProgressCount = computed(() => {
  return myCourses.value.filter(c => getCourseProgress(c.id) < 100 && getCourseProgress(c.id) > 0).length
})

const totalMinutes = computed(() => {
  let total = 0
  Object.values(progressMap.value).forEach(p => {
    total += p.records?.reduce((sum, r) => sum + (r.watched_duration || 0), 0) || 0
  })
  return Math.round(total / 60)
})

const loadMyCourses = async () => {
  if (!user.value) return
  try {
    const res = await request.get(`/users/${user.value.id}/my-courses`)
    myCourses.value = res.data
    
    for (const course of res.data) {
      await loadCourseProgress(course.id)
    }
  } catch (err) {
    console.error('加载我的课程失败:', err)
  }
}

const loadCourseProgress = async (courseId) => {
  try {
    const res = await request.get(`/users/${user.value.id}/study-progress/${courseId}`)
    progressMap.value[courseId] = res.data
  } catch (err) {
    console.error('加载进度失败:', err)
  }
}

const loadRecords = async () => {
  if (!user.value) return
  try {
    const res = await request.get(`/users/${user.value.id}/study-records?pageSize=20`)
    studyRecords.value = res.data
  } catch (err) {
    console.error('加载学习记录失败:', err)
  }
}

const getCourseProgress = (courseId) => {
  return progressMap.value[courseId]?.totalProgress || 0
}

const goToCourse = (id) => {
  router.push(`/course/${id}`)
}

const goLogin = () => {
  router.push('/')
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  if (user.value) {
    loadMyCourses()
  }
})
</script>
