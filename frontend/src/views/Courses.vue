<template>
  <div class="courses">
    <div class="container" style="padding-top: 24px;">
      <h1 style="margin-bottom: 24px; font-size: 28px;">📚 课程中心</h1>
      
      <div class="search-box">
        <input v-model="keyword" placeholder="搜索课程..." @keyup.enter="searchCourses" />
        <button @click="searchCourses">🔍 搜索</button>
      </div>

      <div class="filter-bar">
        <div class="filter-row">
          <span class="filter-label">分类:</span>
          <div class="filter-options">
            <span class="filter-option" :class="{ active: !currentCategory }" @click="filterByCategory('')">全部</span>
            <span
              v-for="cat in categories"
              :key="cat"
              class="filter-option"
              :class="{ active: currentCategory === cat }"
              @click="filterByCategory(cat)"
            >
              {{ cat }}
            </span>
          </div>
        </div>
        <div class="filter-row" style="margin-top: 16px;">
          <span class="filter-label">排序:</span>
          <div class="filter-options">
            <span class="filter-option" :class="{ active: sortBy === '' }" @click="changeSort('')">综合</span>
            <span class="filter-option" :class="{ active: sortBy === 'students' }" @click="changeSort('students')">人气</span>
            <span class="filter-option" :class="{ active: sortBy === 'rating' }" @click="changeSort('rating')">评分</span>
            <span class="filter-option" :class="{ active: sortBy === 'price-asc' }" @click="changeSort('price-asc')">价格↑</span>
            <span class="filter-option" :class="{ active: sortBy === 'price-desc' }" @click="changeSort('price-desc')">价格↓</span>
          </div>
        </div>
      </div>

      <div v-if="courses.length" class="course-grid">
        <CourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无课程</p>
      </div>

      <div v-if="total > pageSize" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="changePage(page - 1)">‹</button>
        <button
          v-for="p in totalPages"
          :key="p"
          class="page-btn"
          :class="{ active: p === page }"
          @click="changePage(p)"
        >
          {{ p }}
        </button>
        <button class="page-btn" :disabled="page === totalPages" @click="changePage(page + 1)">›</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import request from '../utils/request'
import CourseCard from '../components/CourseCard.vue'

const route = useRoute()
const courses = ref([])
const categories = ref([])
const keyword = ref('')
const currentCategory = ref('')
const sortBy = ref('')
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const loadCourses = async () => {
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (currentCategory.value) params.category = currentCategory.value
    if (keyword.value) params.keyword = keyword.value
    if (sortBy.value) params.sort = sortBy.value

    const res = await request.get('/courses', { params })
    courses.value = res.data.list
    total.value = res.data.total
  } catch (err) {
    console.error('加载课程失败:', err)
  }
}

const loadCategories = async () => {
  try {
    const res = await request.get('/categories')
    categories.value = res.data
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

const filterByCategory = (cat) => {
  currentCategory.value = cat
  page.value = 1
  loadCourses()
}

const changeSort = (sort) => {
  sortBy.value = sort
  page.value = 1
  loadCourses()
}

const changePage = (p) => {
  page.value = p
  loadCourses()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const searchCourses = () => {
  page.value = 1
  loadCourses()
}

onMounted(() => {
  if (route.query.category) {
    currentCategory.value = route.query.category
  }
  if (route.query.keyword) {
    keyword.value = route.query.keyword
  }
  loadCategories()
  loadCourses()
})
</script>
