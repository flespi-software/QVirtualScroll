<template>
  <div style="height: 100%">
    <q-item class="q-pa-none">
      <q-item-section class="q-pl-md">
        <q-item-label class="ellipsis text-bold text-white text-h6">Columns</q-item-label>
      </q-item-section>
      <q-item-section side class="q-mr-sm">
        <q-btn dense flat color="white" icon="mdi-plus-circle-outline" @click="$refs.dialog.show()">
          <q-tooltip>
            Add custom column
          </q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section side class="q-mr-md"><q-icon color="white" class="pull-right cursor-pointer" name="mdi-close" @click.native="$emit('cols:close')" size="1.8rem" /></q-item-section>
    </q-item>
    <q-item class="q-px-md q-py-none">
      <q-item-section>
        <q-input outlined v-model="search" label="Search" dense color="white" dark>
          <template v-slot:prepend>
            <q-icon name="mdi-magnify" />
          </template>
        </q-input>
      </q-item-section>
      <q-item-section side>
        <q-btn flat dense color="white" icon="mdi-playlist-star" @click="$emit('cols:default')">
          <q-tooltip>Reset to default columns</q-tooltip>
        </q-btn>
      </q-item-section>
      <q-item-section side>
        <q-btn flat dense color="white" icon="mdi-eye-settings-outline" @click="toggleAllColumnsHandler">
          <q-tooltip>Toogle all columns</q-tooltip>
        </q-btn>
      </q-item-section>
    </q-item>
    <div style="height: calc(100% - 96px); overflow: auto;" v-if="cols.length">
      <q-list separator dark>
        <col-item
          :col="cols[0]"
          v-if="cols[0].__dest === 'action'"
          @toggle="cols[0].display = !cols[0].display, updateCols()"
          @width="updateCols()"
        />
        <draggable :list="cols" handle=".handle" @end="updateCols">
          <template v-for="(col, index) in cols">
            <col-item
              v-if="col.name.indexOf(search) !== -1 && !col.__dest"
              :key="index"
              :col="col"
              @remove="cols.splice(index, 1), updateCols()"
              @toggle="col.display = !col.display, updateCols()"
              @width="updateCols()"
            />
          </template>
        </draggable>
        <col-item
          :col="cols[cols.length - 1]"
          v-if="cols[cols.length - 1].__dest === 'etc'"
          @toggle="cols[cols.length - 1].display = !cols[cols.length - 1].display, updateCols()"
          @width="updateCols()"
        />
      </q-list>
    </div>
    <custom-field-dialog ref="dialog" @ok="addCustomColumnHandler"/>
  </div>
</template>

<script>
import Draggable from 'vuedraggable'
import CustomFieldDialog from './CustomFieldDialog'
import ColItem from './ColItem'
export default {
  props: ['cols'],
  data () {
    return {
      search: ''
    }
  },
  methods: {
    toggleAllColumnsHandler () {
      let flag = this.cols.reduce((flag, col) => {
        if (col.__dest === 'etc') { return flag }
        return flag || col.display
      }, false)
      flag = !flag
      this.cols.forEach((_, index) => {
        this.$set(this.cols[index], 'display', flag)
      })
      if (!flag && this.cols[this.cols.length - 1].__dest === 'etc') {
        this.$set(this.cols[this.cols.length - 1], 'display', !flag)
      }
      this.updateCols()
    },
    addCustomColumnHandler (col) {
      if (this.cols[this.cols.length - 1].__dest === 'etc') {
        this.cols.splice(this.cols.length - 2, 0, col)
      } else {
        this.cols.push(col)
      }
      this.updateCols()
    },
    updateCols () {
      this.$emit('cols:update', this.cols)
    }
  },
  components: { Draggable, CustomFieldDialog, ColItem }
}
</script>

<style lang="stylus">
  .cols-editor__col[draggable="true"]
    background-color #9e9e9e
</style>
