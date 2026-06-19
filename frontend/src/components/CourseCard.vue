<template>
  <div class="course-card" @click="handleClick">
    <img :src="course.cover" :alt="course.title" />
    <div class="course-card-content">
      <div class="course-tags" v-if="course.tags && course.tags.length">
        <span class="tag" v-for="tag in course.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
      </div>
      <h3 class="course-card-title">{{ course.title }}</h3>
      <div class="course-card-meta">
        <div class="rating">
          <span>⭐</span>
          <span>{{ course.rating }}</span>
          <span>({{ course.rating_count }})</span>
        </div>
        <span>👥 {{ course.students_count }}</span>
      </div>
      <div class="course-card-price">
        <span class="current-price">¥{{ course.price }}</span>
        <span class="original-price" v-if="course.original_price">¥{{ course.original_price }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])
const router = useRouter()

const handleClick = () => {
  emit('click', props.course)
  router.push(`/course/${props.course.id}`)
}
</script>
