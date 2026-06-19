<template>
  <div class="video-player">
    <video
      ref="videoRef"
      :src="src"
      controls
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
    ></video>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '../utils/request'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  chapterId: {
    type: Number,
    default: null
  },
  courseId: {
    type: Number,
    default: null
  },
  userId: {
    type: Number,
    default: null
  },
  initialProgress: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['progress', 'timeupdate', 'ended'])

const videoRef = ref(null)
const duration = ref(0)
const currentTime = ref(0)
let saveTimer = null

const handleLoadedMetadata = () => {
  duration.value = videoRef.value.duration
  if (props.initialProgress > 0 && duration.value > 0) {
    const savedTime = (props.initialProgress / 100) * duration.value
    videoRef.value.currentTime = savedTime
  }
}

const handleTimeUpdate = () => {
  currentTime.value = videoRef.value.currentTime
  const progress = duration.value > 0 ? Math.round((currentTime.value / duration.value) * 100) : 0
  emit('timeupdate', currentTime.value)
  emit('progress', progress)

  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveProgress(progress)
  }, 3000)
}

const handleEnded = () => {
  saveProgress(100)
  emit('ended')
}

const saveProgress = async (progress) => {
  if (!props.userId || !props.courseId || !props.chapterId) return
  
  try {
    await request.post('/study-records', {
      user_id: props.userId,
      course_id: props.courseId,
      chapter_id: props.chapterId,
      progress: progress,
      watched_duration: Math.round(currentTime.value)
    })
  } catch (err) {
    console.error('保存进度失败:', err)
  }
}

watch(() => props.src, () => {
  if (videoRef.value) {
    videoRef.value.load()
  }
})

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    if (saveTimer) clearTimeout(saveTimer)
    const progress = duration.value > 0 ? Math.round((currentTime.value / duration.value) * 100) : 0
    if (progress > 0 && progress < 100) {
      navigator.sendBeacon && navigator.sendBeacon('/api/study-records', JSON.stringify({
        user_id: props.userId,
        course_id: props.courseId,
        chapter_id: props.chapterId,
        progress: progress,
        watched_duration: Math.round(currentTime.value)
      }))
    }
  })
})
</script>
