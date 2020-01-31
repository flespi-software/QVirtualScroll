<template>
  <q-dialog ref="dialog">
    <q-card class="q-dialog-plugin">
      <q-item-section class="q-px-md q-pt-md bg-grey-9">
        <q-item-label header class="q-pa-none">
          <q-input v-model="name" outlined dense dark color="white" placeholder="parameter name">
            <q-btn slot="after" :icon="display ? 'mdi-eye' : 'mdi-eye-off'" @click="display = !display" :color="display ? 'white' : 'grey-8'" flat dense>
              <q-tooltip>{{display ? 'Hide this column' : 'Show this column'}}</q-tooltip>
            </q-btn>
          </q-input>
        </q-item-label>
        <q-item-label subtitle>
          <q-slider class="col-8" :min="50" :max="800" :step="25"
            :value="width" @change="value => width = value"
            dark
            color="grey-8"
          />
        </q-item-label>
      </q-item-section>
      <q-card-actions align="right" class="bg-grey-9">
        <q-btn flat dense color="white" label="Cancel" @click="onCancelClick" />
        <q-btn flat dense color="white" label="Add" @click="onOKClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  data () {
    return {
      name: '',
      width: 150,
      display: true
    }
  },
  methods: {
    show () { this.$refs.dialog.show() },
    hide () { this.$refs.dialog.hide() },
    onCancelClick () { this.hide() },
    onOKClick () {
      this.$emit('ok', { name: this.name, width: this.width, display: this.display })
      this.hide()
    }
  }
}
</script>
