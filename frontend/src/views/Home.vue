<template>
  <div class="home">
    <div class="container" style="padding-top: 24px;">
      <div class="banner">
        <img :src="banners[currentBanner]?.image" alt="banner" @click="goToLink(banners[currentBanner]?.link)" />
        <div class="banner-content">
          <h2>{{ banners[currentBanner]?.title }}</h2>
        </div>
        <div class="banner-dots">
          <span
            v-for="(banner, index) in banners"
            :key="banner.id"
            class="banner-dot"
            :class="{ active: index === currentBanner }"
            @click="currentBanner = index"
          ></span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h2>🔥 热门推荐</h2>
          <router-link to="/courses">查看全部 →</router-link>
        </div>
        <div class="course-grid">
          <CourseCard v-for="course in hotCourses" :key="course.id" :course="course" />
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h2>🆕 最新课程</h2>
          <router-link to="/courses">查看全部 →</router-link>
        </div>
        <div class="course-grid">
          <CourseCard v-for="course in newCourses" :key="course.id" :course="course" />
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          <h2>📚 分类浏览</h2>
        </div>
        <div class="filter-options" style="justify-content: center;">
          <span
            v-for="cat in categories"
            :key="cat"
            class="filter-option"
            @click="goToCategory(cat)"
          >
            {{ cat }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import CourseCard from '../components/CourseCard.vue'

const router = useRouter()
const banners = ref([])
const hotCourses = ref([])
const newCourses = ref([])
const categories = ref([])
const currentBanner = ref(0)
let bannerTimer = null

const loadData = async () => {
  try {
    const [bannerRes, hotRes, newRes, catRes] = await Promise.all([
      request.get('/banners'),
      request.get('/courses?sort=students&pageSize=4'),
      request.get('/courses?pageSize=4'),
      request.get('/categories')
    ])
    banners.value = bannerRes.data
    hotCourses.value = hotRes.data.list
    newCourses.value = newRes.data.list
    categories.value = catRes.data
  } catch (err) {
    console.error('加载首页数据失败:', err)
  }
}

const startBannerTimer = () => {
  bannerTimer = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % banners.value.length
  }, 4000)
}

const goToLink = (link) => {
  if (link) router.push(link)
}

const goToCategory = (cat) => {
  router.push({ path: '/courses', query: { category: cat } })
}

onMounted(() => {
  loadData().then(() => {
    if (banners.value.length > 1) startBannerTimer()
  })
})
</script>
