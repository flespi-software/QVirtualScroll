<template>
  <div class="relative-position flex flex-center" :class="[`bg-${theme.bgColor}`, `${theme.bgColor === 'white' ? '' : 'flatpickr__theme-dark'}`]" style="max-width: 307px;">
    <div class="fit text-center q-mb-sm">
      <q-btn-toggle :value="dateRangeMode" @change="dateRangeModeChange" :options="dateRangeModeOptions" :color="theme.bgColor" text-color="grey" :toggle-text-color="theme.color" flat rounded/>
    </div>
    <div class="time-range-input__wrapper q-mb-sm">
      <flat-pickr
        ref="pickr"
        v-if="dateRangeShow"
        v-model="currentDateRange"
        @input="inputCurrentDateRangeHandler"
        :config="dateRangeConfig"
      />
    </div>
    <div v-if="dateRangeMode === DATE_RANGE_MODE_CURRENT" class="time-range-input__wrapper q-mb-sm row">
      <div class="time-range-input__time wrapper__begin col-5">
        <div class="time__label" :class="[`text-${theme.color}`]">{{formatDate(currentDateRangeModel[0].valueOf(), 'DD/MM/YYYY')}}</div>
        <flat-pickr
          ref="beginTime"
          :value="currentBeginTime"
          @input="beginTimeChangeHandler"
          :config="{
            enableTime: true,
            noCalendar: true,
            time_24hr: true,
            enableSeconds: true,
            inline: true
          }"
        />
      </div>
      <div class="col-2 text-center" :class="[`text-${theme.color}`]" style="line-height: 31px; font-size: 1.4rem; padding-top: 22px;">&ndash;</div>
      <div class="time-range-input__time wrapper__end col-5">
        <div class="time__label" :class="[`text-${theme.color}`]">{{currentDateRangeModel[1] ? formatDate(currentDateRangeModel[1].valueOf(), 'DD/MM/YYYY') : formatDate(Date.now(), 'DD/MM/YYYY')}}</div>
        <flat-pickr
          ref="endTime"
          :value="currentEndTime"
          @input="endTimeChangeHandler"
          :config="{
            enableTime: true,
            noCalendar: true,
            time_24hr: true,
            enableSeconds: true,
            inline: true
          }"
        />
      </div>
    </div>
  </div>
</template>

<script>
import {date} from 'quasar'
import flatPickr from 'vue-flatpickr-component'
import weekSelect from 'flatpickr/dist/plugins/weekSelect/weekSelect'
import monthSelect from 'flatpickr/dist/plugins/monthSelect/index'
import 'flatpickr/dist/plugins/monthSelect/style.css'
import 'flatpickr/dist/flatpickr.css'

const DATE_RANGE_MODE_DAY = 0,
    DATE_RANGE_MODE_WEEK = 1,
    DATE_RANGE_MODE_MONTH = 2,
    DATE_RANGE_MODE_CURRENT = 3

export default {
  name: 'DateRangePicker',
  props: {
    value: {
      type: Array,
      default () { return [Date.now()] }
    },
    theme: Object
  },
  data () {
    let self = this
    let currentDateRangeModel = this.value.map(timestamp => new Date(timestamp))
    return {
      currentDateRange: new Date(this.value[0]),
      currentDateRangeModel,
      dateRangeConfig: {
        mode: 'single',
        inline: true,
        maxDate: 'today',
        locale: {
          firstDayOfWeek: 1
        },
        onChange: [function () {
          if (!this.selectedDates.length) { return false }
          self.currentDateRangeModel = this.selectedDates
        }]
      },
      currentBeginTime: currentDateRangeModel[0],
      currentEndTime: currentDateRangeModel[1],
      dateRangeMode: DATE_RANGE_MODE_DAY,
      dateRangeShow: true,
      dateRangeModeOptions: [
        {label: 'Day', value: DATE_RANGE_MODE_DAY},
        {label: 'Week', value: DATE_RANGE_MODE_WEEK},
        {label: 'Month', value: DATE_RANGE_MODE_MONTH},
        {label: 'Current', value: DATE_RANGE_MODE_CURRENT}
      ],
      selectedInput: 0,
      DATE_RANGE_MODE_DAY,
      DATE_RANGE_MODE_WEEK,
      DATE_RANGE_MODE_MONTH,
      DATE_RANGE_MODE_CURRENT,
      isChangeFromOutside: false
    }
  },
  methods: {
    formatDate: date.formatDate,
    dateRangeShowToggle () {
      this.dateRangeShow = !this.dateRangeShow
    },
    dateRangeModeChange (mode) {
      this.selectedInput = 0
      this.dateRangeShowToggle()
      this.dateRangeMode = mode
      this.currentDateRange = mode === DATE_RANGE_MODE_CURRENT ? [...this.currentDateRangeModel] : [this.currentDateRangeModel[0]]
      let self = this
      let config = {
        inline: true,
        maxDate: 'today',
        locale: this.dateRangeConfig.locale,
        onChange: this.dateRangeConfig.onChange
      }
      if (this.dateRangeMode === DATE_RANGE_MODE_DAY) {
        config.mode = 'single'
      } else if (this.dateRangeMode === DATE_RANGE_MODE_WEEK) {
        config.plugins = [new weekSelect({})]
      } else if (this.dateRangeMode === DATE_RANGE_MODE_MONTH) {
        config.plugins = [new monthSelect({})]
      } else if (this.dateRangeMode === DATE_RANGE_MODE_CURRENT) {
        config.mode = 'range'
      }
      this.dateRangeConfig = config
      this.$nextTick(() => { this.dateRangeShowToggle() })
    },
    getValue () {
      let range = this.$refs.pickr.fp.selectedDates
      if (this.dateRangeMode === DATE_RANGE_MODE_DAY) {
        let curr = range[0]
        range = [curr.setHours(0, 0, 0, 0), curr.setHours(23, 59, 59, 999)]
      } else if (this.dateRangeMode === DATE_RANGE_MODE_WEEK) {
        let curr = range[0]
        let first = curr.getDate() - curr.getDay() + 1
        let last = first + 7
        let firstday = new Date(curr.setDate(first))
        firstday.setHours(0, 0, 0, 0)
        let lastday = new Date(curr.setDate(last))
        lastday.setHours(0, 0, 0, 0)
        lastday = lastday - 1
        if (lastday > new Date()) {
          lastday = new Date()
        }
        range = [firstday.valueOf(), lastday.valueOf()]
      } else if (this.dateRangeMode === DATE_RANGE_MODE_MONTH) {
        let date = new Date(range[0].valueOf() + 86400000), y = date.getUTCFullYear(), m = date.getUTCMonth()
        let firstday = new Date(y, m, 1)
        firstday.setHours(0, 0, 0, 0)
        let lastday = new Date(y, m + 1, 1)
        lastday.setHours(0, 0, 0, 0)
        lastday = lastday - 1
        if (lastday > new Date()) {
          lastday = new Date()
        }
        range = [firstday.valueOf(), lastday.valueOf()]
      } else if (this.dateRangeMode === DATE_RANGE_MODE_CURRENT) {
        let begin = this.$refs.beginTime.fp.selectedDates[0]
        let end = this.$refs.endTime.fp.selectedDates[0]
        let first = range[0]
        let last = range[1]
        if (!first || !last) { return undefined }
        first.setHours(begin.getHours(), begin.getMinutes(), begin.getSeconds(), 0)
        last.setHours(end.getHours(), end.getMinutes(), end.getSeconds())
        range = [first.valueOf(), last.valueOf()]
      }
      return range
    },
    beginTimeChangeHandler (val) {
      this.currentBeginTime = val
      let value = this.getValue()
      if (value) { this.$emit('input', value) }
    },
    endTimeChangeHandler (val) {
      this.currentEndTime = val
      let value = this.getValue()
      if (value) { this.$emit('input', value) }
    },
    inputCurrentDateRangeHandler () {
      if (this.dateRangeMode !== DATE_RANGE_MODE_CURRENT) {
        this.$emit('hide')
      }
    }
  },
  watch: {
    currentDateRangeModel () {
      if (this.isChangeFromOutside) {
        this.isChangeFromOutside = false
        return false
      }
      let value = this.getValue()
      if (value) { this.$emit('input', value) }
    },
    value (value) {
      if (value[0] === this.currentDateRangeModel[0].valueOf() && value[1] && this.currentDateRangeModel[1] && this.currentDateRangeModel[1].valueOf() === value[1]) { return false }
      let currentDateRangeModel = value.map(timestamp => new Date(timestamp))
      this.$refs.pickr.fp.setDate(this.dateRangeMode === DATE_RANGE_MODE_CURRENT ? [...currentDateRangeModel] : currentDateRangeModel[0])
      this.currentBeginTime = currentDateRangeModel[0]
      this.currentEndTime = currentDateRangeModel[1]
      this.isChangeFromOutside = true
      this.currentDateRangeModel = currentDateRangeModel
    }
  },
  components: { flatPickr }
}
</script>

<style lang="stylus">
  .date-range-wrapper:after
    content ''
    position absolute
    left 42%
    top 100%
    width 0
    height 0
    border-left 20px solid transparent
    border-right 20px solid transparent
    border-top 20px solid #e8e8e8
    clear both
  .flatpickr__theme-dark
    $calendarBackground = #565656
    $calendarBorderColor = darken(#565656, 50%)
    $monthForeground = #fff
    $monthBackground = #565656
    $weekdaysBackground = transparent
    $weekdaysForeground = #fff
    $dayForeground = alpha(white, 0.95)
    $dayHoverBackground = lighten($calendarBackground, 25%)
    $todayColor = #eee
    $today_fg_color = #565656
    $selectedDayBackground = #666
    @require "~flatpickr/src/style/flatpickr"
    .flatpickr-monthSelect-month
      color $monthForeground
      &.selected
        background-color $selectedDayBackground
        color $monthForeground
  .time-range-input__wrapper
    width 307px
    .time-range-input__time
      .flatpickr-calendar
        width 100%
      .time__label
        font-size .8rem
        font-weight bold
        padding-left 5px
    input
      display none
</style>
