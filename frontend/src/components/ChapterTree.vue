<template>
  <div class="chapter-tree">
    <div class="chapter-tree-title">
      <span>📚 课程目录</span>
      <span style="font-size: 13px; color: var(--text-muted);">{{ totalLessons }} 节</span>
    </div>
    <div v-for="chapter in chapters" :key="chapter.id" class="chapter-item">
      <div class="chapter-header" @click="toggleChapter(chapter.id)">
        <span>{{ chapter.title }}</span>
        <span>{{ expandedChapter === chapter.id ? '▲' : '▼' }}</span>
      </div>
      <div v-show="expandedChapter === chapter.id" class="chapter-lessons">
        <div
          v-for="lesson in chapter.children"
          :key="lesson.id"
          class="lesson-item"
          :class="{ active: activeLessonId === lesson.id }"
          @click="selectLesson(lesson)"
        >
          <div class="lesson-title">
            <span v-if="lesson.is_free" class="free-badge">免费</span>
            <span v-else-if="!isPurchased" class="lock-icon">🔒</span>
            <span v-else-if="getProgress(lesson.id) >= 100" class="lock-icon" style="color: var(--success)">✅</span>
            <span>{{ lesson.title }}</span>
          </div>
          <span class="lesson-duration">{{ formatDuration(lesson.duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  chapters: {
    type: Array,
    default: () => []
  },
  activeLessonId: {
    type: Number,
    default: null
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  progressRecords: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select'])

const expandedChapter = ref(null)

const totalLessons = computed(() => {
  let count = 0
  props.chapters.forEach(ch => {
    count += ch.children?.length || 0
  })
  return count
})

onMounted(() => {
  if (props.chapters.length > 0) {
    expandedChapter.value = props.chapters[0].id
  }
})

const toggleChapter = (id) => {
  expandedChapter.value = expandedChapter.value === id ? null : id
}

const selectLesson = (lesson) => {
  if (!props.isPurchased && !lesson.is_free) {
    alert('请先购买课程后观看')
    return
  }
  if (!lesson.video_url) {
    alert('该章节暂无视频')
    return
  }
  emit('select', lesson)
}

const getProgress = (lessonId) => {
  const record = props.progressRecords.find(r => r.chapter_id === lessonId)
  return record?.progress || 0
}

const formatDuration = (seconds) => {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>
