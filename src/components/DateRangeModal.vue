<template>
  <div class="q-v-date-range-picker" style="min-width: 180px">
    <q-btn :color="theme.color" flat dense @click="prevHandler" icon="keyboard_arrow_left">
      <q-tooltip>Previous time range</q-tooltip>
    </q-btn>
    <q-btn @click="dateRangeToggle" flat :color="theme.color" style="min-width: 124px; font-size: .8rem; line-height: .8rem;" class="q-pa-none">
      <div>
        <div>{{formatDate(dateModel[0])}}</div>
        <div style="font-size: .5rem">|</div>
        <div>{{formatDate(dateModel[1])}}</div>
      </div>
      <q-tooltip>Change time</q-tooltip>
    </q-btn>
    <q-btn :color="theme.color" flat dense @click="nextHandler" icon="keyboard_arrow_right">
      <q-tooltip>Next time range</q-tooltip>
    </q-btn>
    <q-dialog ref="dateRangePickerModal" content-class="modal-date-range">
      <q-card>
        <q-card-section class="scroll q-pa-none" :class="{[`bg-${theme.bgColor}`]: true, 'text-white': !!theme.bgColor}">
          <div class="flex flex-center">
            <date-range-picker
              class="q-ma-sm"
              v-model="dateModel"
              :mode="mode"
              :theme="theme"
              @change:mode="changeModeDateTimeRangeHandler"
              @error="flag => saveDisabled = flag"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right" :class="{[`bg-${theme.bgColor}`]: true, 'text-white': !!theme.bgColor}">
          <q-btn flat :color="theme.color" @click="dateRangeModalClose">close</q-btn>
          <q-btn flat :color="theme.color" @click="dateRangeModalSave" :disable="saveDisabled">save</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { date, debounce } from 'quasar'
import DateRangePicker from 'datetimerangepicker'
export default {
  props: ['theme', 'date'],
  data () {
    return {
      dateModel: this.date,
      mode: 0,
      saveDisabled: false
    }
  },
  methods: {
    dateRangeToggle () {
      this.$refs.dateRangePickerModal.toggle()
    },
    dateRangeModalClose () {
      this.$refs.dateRangePickerModal.hide()
    },
    changeModeDateTimeRangeHandler (mode) {
      this.mode = mode
    },
    dateRangeModalSave () {
      this.$emit('save', this.dateModel)
      this.dateRangeModalClose()
    },
    formatDate (timestamp) {
      return date.formatDate(timestamp, 'DD/MM/YYYY HH:mm:ss')
    },
    prevHandler () {
      const delta = this.dateModel[1] - this.dateModel[0],
        newTo = this.dateModel[0] - 1,
        newFrom = newTo - delta
      this.dateModel = [newFrom, newTo]
      this.debouncedSave()
    },
    nextHandler () {
      const delta = this.dateModel[1] - this.dateModel[0],
        newFrom = this.dateModel[1] + 1,
        newTo = newFrom + delta
      this.dateModel = [newFrom, newTo]
      this.debouncedSave()
    }
  },
  created () {
    this.debouncedSave = debounce(() => { this.$emit('save', this.dateModel) }, 300)
  },
  watch: {
    date (date) {
      this.dateModel = date
    }
  },
  components: { DateRangePicker }
}
</script>

<style lang="stylus">
  .q-v-date-range-picker
    .q-btn__wrapper
      padding-left 0
      padding-right 0
  .modal-date-range
    .q-dialog__inner--minimized
      padding 6px
</style>
