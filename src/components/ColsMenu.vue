<template>
  <q-list dark class="bg-grey-7 q-py-sm">
    <q-item clickable dense v-ripple v-if="selection" @click="copyHandler" class="q-px-sm" v-close-popup>
      <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
        <q-icon name="mdi-content-copy" />
      </q-item-section>
      <q-item-section>Copy</q-item-section>
    </q-item>
    <q-separator v-if="selection" spaced inset dark />
    <q-item clickable dense v-ripple v-if="!editableNewCol" @click="editableNewCol = true" class="q-px-sm">
      <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
        <q-icon name="mdi-plus-circle-outline" />
      </q-item-section>
      <q-item-section>Add column</q-item-section>
    </q-item>
    <q-item clickable v-ripple v-else dense class="q-px-sm" @keyup.enter="add">
      <q-item-section>
        <q-input color="white" dark v-model="colShema.name" type="text" label="Field name" hide-bottom-space outlined dense autofocus :error="!colShema.name" no-error-icon>
          <q-btn slot="append" :disable="!colShema.name" flat dense icon="mdi-plus-circle-outline" @click="add" v-close-popup>
            <q-tooltip>Add</q-tooltip>
          </q-btn>
        </q-input>
      </q-item-section>
    </q-item>
    <q-item clickable v-ripple dense class="q-px-sm" v-close-popup @click="$emit('to-std')">
      <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
        <q-icon name="mdi-playlist-star" />
      </q-item-section>
      <q-item-section>Reset columns</q-item-section>
    </q-item>
    <q-item clickable v-ripple @click="$emit('toggle-all')" dense class="q-px-sm" v-close-popup>
      <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
        <q-icon name="mdi-eye-settings-outline" />
      </q-item-section>
      <q-item-section>Toggle all columns</q-item-section>
    </q-item>
    <q-item clickable v-ripple v-if="col && !col.data.__dest" @click="$emit('remove')" dense class="q-px-sm" v-close-popup>
      <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
        <q-icon name="mdi-table-column-remove" />
      </q-item-section>
      <q-item-section>Remove column</q-item-section>
    </q-item>
    <q-separator v-if="row && row.actions && row.actions.length" spaced inset dark />
    <template v-if="row && row.actions && row.actions.length">
      <q-item clickable v-ripple @click="$emit('action', action.type)" dense class="q-px-sm" v-for="action in row.actions" :key="action.label" v-close-popup>
        <q-item-section avatar class="q-pr-sm" style="min-width: 20px">
          <q-icon :name="action.icon" />
        </q-item-section>
        <q-item-section>{{action.label}}</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script>
import { copyToClipboard } from 'quasar'
export default {
  props: ['col', 'row'],
  data () {
    const selection = this.getSelection()
    return {
      editableNewCol: false,
      colShema: { name: '', width: 150, display: true },
      selection
    }
  },
  methods: {
    copyHandler () {
      copyToClipboard(this.selection)
        .then(() => {})
        .catch(() => {})
    },
    add () {
      if (this.colShema.name) {
        this.$emit('add', this.colShema)
        this.editableNewCol = false
      }
      this.$emit('done')
    },
    getSelection () {
      let data = this.col && this.row ? this.row.data[this.col.data.name] : null
      if (data && this.col.data.__dest) {
        data = null
      } else if ((data !== undefined && data !== null) && this.row.dataHandler) {
        data = this.row.dataHandler(this.col, this.row, data)
      }
      return data
    }
  }
}
</script>
