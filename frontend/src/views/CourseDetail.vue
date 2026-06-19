<template>
  <div class="course-detail-page">
    <div class="container" style="padding-top: 24px;">
      <div v-if="course" class="course-detail">
        <div class="course-main">
          <VideoPlayer
            v-if="currentLesson?.video_url"
            :src="currentLesson.video_url"
            :chapterId="currentLesson.id"
            :courseId="course.id"
            :userId="user?.id"
            :initialProgress="getLessonProgress(currentLesson.id)"
            @ended="handleVideoEnded"
          />
          <div v-else class="video-player" style="display: flex; align-items: center; justify-content: center; color: #999;">
            请选择章节开始学习
          </div>

          <div class="course-info">
            <h1>{{ course.title }}</h1>
            <div class="course-meta">
              <span class="course-meta-item">⭐ {{ course.rating }} ({{ course.rating_count }} 评价)</span>
              <span class="course-meta-item">👥 {{ course.students_count }} 人学习</span>
              <span class="course-meta-item">📚 {{ course.level }}</span>
              <span class="course-meta-item">🏷️ {{ course.category }}</span>
            </div>

            <div class="instructor-card">
              <img :src="course.instructor_avatar" :alt="course.instructor" />
              <div class="instructor-info">
                <h4>{{ course.instructor }}</h4>
                <p>资深讲师，10年开发经验</p>
              </div>
            </div>

            <div class="tab-nav">
              <div class="tab-item" :class="{ active: activeTab === 'intro' }" @click="activeTab = 'intro'">课程简介</div>
              <div class="tab-item" :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'; loadComments()">学员评价</div>
            </div>

            <div class="tab-content">
              <div v-if="activeTab === 'intro'">
                <div class="course-tags" style="margin-bottom: 16px;">
                  <span class="tag" v-for="tag in course.tags" :key="tag">{{ tag }}</span>
                </div>
                <p style="color: var(--text-secondary); line-height: 1.8;">{{ course.description }}</p>
              </div>

              <div v-if="activeTab === 'comments'">
                <div v-if="user" class="comment-form" style="margin-bottom: 24px;">
                  <textarea
                    v-model="newComment"
                    placeholder="写下你的评价..."
                    style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; min-height: 80px; resize: vertical;"
                  ></textarea>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
                    <div class="rating">
                      评分: 
                      <span v-for="i in 5" :key="i" @click="rating = i" style="cursor: pointer; font-size: 20px;">
                        {{ i <= rating ? '⭐' : '☆' }}
                      </span>
                    </div>
                    <button class="btn btn-primary" @click="submitComment">发表评价</button>
                  </div>
                </div>

                <div v-if="comments.length">
                  <div v-for="comment in comments" :key="comment.id" class="comment-item">
                    <img :src="comment.avatar" class="comment-avatar" :alt="comment.username" />
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-username">{{ comment.username }}</span>
                        <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                      </div>
                      <div class="rating" style="margin-bottom: 8px;">
                        <span v-for="i in 5" :key="i">{{ i <= comment.rating ? '⭐' : '☆' }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-state" style="padding: 40px 20px;">
                  <div class="empty-icon" style="font-size: 48px;">💬</div>
                  <p class="empty-text">暂无评价，快来抢沙发！</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="course-sidebar">
          <div class="price-card">
            <div class="course-card-price">
              <span class="current-price">¥{{ course.price }}</span>
              <span class="original-price" v-if="course.original_price">¥{{ course.original_price }}</span>
            </div>
            <div v-if="totalProgress !== null" style="margin: 16px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span>学习进度</span>
                <span style="color: var(--primary); font-weight: 600;">{{ totalProgress }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: totalProgress + '%' }"></div>
              </div>
            </div>
            <button v-if="!isPurchased" class="btn btn-primary btn-block" @click="buyCourse">
              立即购买
            </button>
            <button v-else class="btn btn-primary btn-block" @click="continueStudy">
              继续学习
            </button>
            <button class="btn btn-outline btn-block" style="margin-top: 12px;">
              📥 加入收藏
            </button>
          </div>

          <ChapterTree
            :chapters="course.chapters || []"
            :activeLessonId="currentLesson?.id"
            :isPurchased="isPurchased"
            :progressRecords="progressRecords"
            @select="selectLesson"
          />
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">⏳</div>
        <p class="empty-text">加载中...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import VideoPlayer from '../components/VideoPlayer.vue'
import ChapterTree from '../components/ChapterTree.vue'

const route = useRoute()
const router = useRouter()
const course = ref(null)
const currentLesson = ref(null)
const activeTab = ref('intro')
const comments = ref([])
const newComment = ref('')
const rating = ref(5)
const isPurchased = ref(false)
const progressRecords = ref([])
const totalProgress = ref(null)
const user = computed(() => {
  const saved = localStorage.getItem('user')
  return saved ? JSON.parse(saved) : null
})

const loadCourse = async () => {
  try {
    const res = await request.get(`/courses/${route.params.id}`)
    course.value = res.data
    
    const firstLesson = findFirstLesson(res.data.chapters)
    if (firstLesson) {
      currentLesson.value = firstLesson
    }

    if (user.value) {
      await checkPurchaseStatus()
      await loadProgress()
    }
  } catch (err) {
    console.error('加载课程失败:', err)
  }
}

const findFirstLesson = (chapters) => {
  for (const ch of chapters) {
    if (ch.children && ch.children.length > 0) {
      return ch.children[0]
    }
  }
  return null
}

const checkPurchaseStatus = async () => {
  try {
    const res = await request.get(`/users/${user.value.id}/my-courses`)
    isPurchased.value = res.data.some(c => c.id === parseInt(route.params.id))
  } catch (err) {
    console.error('检查购买状态失败:', err)
  }
}

const loadProgress = async () => {
  try {
    const res = await request.get(`/users/${user.value.id}/study-progress/${route.params.id}`)
    progressRecords.value = res.data.records
    totalProgress.value = res.data.totalProgress
  } catch (err) {
    console.error('加载进度失败:', err)
  }
}

const loadComments = async () => {
  try {
    const res = await request.get(`/courses/${route.params.id}/comments?pageSize=20`)
    comments.value = res.data.list
  } catch (err) {
    console.error('加载评论失败:', err)
  }
}

const selectLesson = (lesson) => {
  currentLesson.value = lesson
}

const getLessonProgress = (lessonId) => {
  const record = progressRecords.value.find(r => r.chapter_id === lessonId)
  return record?.progress || 0
}

const handleVideoEnded = () => {
  loadProgress()
}

const buyCourse = async () => {
  if (!user.value) {
    alert('请先登录')
    return
  }
  if (!confirm(`确定购买 "${course.value.title}" 课程吗？\n价格: ¥${course.value.price}`)) {
    return
  }
  try {
    await request.post('/orders', {
      user_id: user.value.id,
      course_id: course.value.id,
      amount: course.value.price
    })
    alert('购买成功！现在可以开始学习了')
    isPurchased.value = true
  } catch (err) {
    alert('购买失败: ' + (err.response?.data?.message || err.message))
  }
}

const continueStudy = () => {
  const lastWatched = progressRecords.value.sort((a, b) => 
    new Date(b.last_watched_at) - new Date(a.last_watched_at)
  )[0]
  
  if (lastWatched) {
    const allLessons = []
    const collectLessons = (chapters) => {
      chapters.forEach(ch => {
        if (ch.children) collectLessons(ch.children)
        else allLessons.push(ch)
      })
    }
    collectLessons(course.value.chapters)
    const lesson = allLessons.find(l => l.id === lastWatched.chapter_id)
    if (lesson) currentLesson.value = lesson
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) {
    alert('请填写评价内容')
    return
  }
  try {
    await request.post(`/courses/${route.params.id}/comments`, {
      user_id: user.value.id,
      content: newComment.value,
      rating: rating.value
    })
    alert('评价成功！')
    newComment.value = ''
    rating.value = 5
    loadComments()
  } catch (err) {
    alert('评价失败: ' + (err.response?.data?.message || err.message))
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadCourse()
})
</script>
