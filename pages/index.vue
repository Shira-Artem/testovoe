<script setup lang="ts">
import { ref, useCssModule } from 'vue'
import BookingForm from '~/components/BookingForm/BookingForm.vue'
import ConfirmationScreen from '~/components/ConfirmationScreen/ConfirmationScreen.vue'
import type { BookingFormData } from '~/types/booking'

const booking = ref<BookingFormData | null>(null)
const styles = useCssModule()
const screenTransition = {
  enterActiveClass: styles.enterActive ?? '',
  leaveActiveClass: styles.leaveActive ?? '',
  enterFromClass: styles.enterFrom ?? '',
  leaveToClass: styles.leaveTo ?? '',
}

useHead({
  title: 'Бронирование столика',
  meta: [
    {
      name: 'description',
      content: 'Онлайн-бронирование столика в ресторане.',
    },
  ],
})
</script>

<template>
  <main :class="$style.page">
    <div :class="$style.shell">
      <aside :class="$style.intro">
        <p :class="$style.kicker">Время для хорошего вечера</p>
        <h2 :class="$style.introTitle">Ваш столик ждёт вас</h2>
        <p :class="$style.introText">
          Выберите удобную дату и время. Подтверждение займёт всего несколько секунд.
        </p>
        <div :class="$style.note">
          <span :class="$style.noteLine" aria-hidden="true" />
          Ежедневно с 12:00 до 22:00
        </div>
      </aside>

      <div :class="$style.content">
        <Transition mode="out-in" v-bind="screenTransition">
          <BookingForm v-if="!booking" key="form" @confirmed="booking = $event" />
          <ConfirmationScreen
            v-else
            key="confirmation"
            :booking="booking"
            @reset="booking = null"
          />
        </Transition>
      </div>
    </div>
  </main>
</template>

<style module lang="scss" src="./index.module.scss"></style>
