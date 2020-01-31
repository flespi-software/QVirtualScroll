<template>
  <q-item class="cols-editor__col">
    <q-item-section avatar class="q-pr-none">
      <q-icon size="1.5rem" :class="{handle: !col.__dest}" name="mdi-drag" :style="{cursor: col.__dest ? '' : 'move'}" :color="col.display && !col.__dest ? 'white' : 'grey-8'"/>
    </q-item-section>
    <q-item-section>
      <q-item-label header class="q-pa-none">
        <div class="ellipsis text-bold text-white" style="display: inline-block; line-height: 32px;" :style="{width: `calc(100% - ${col.__dest ? 32 : 64}px)`}">{{col.name}}<q-tooltip>{{col.name}}</q-tooltip></div>
        <div class="float-right" style="display: inline-block">
          <q-btn v-if="!col.__dest" icon="mdi-minus" @click="$emit('remove')" :color="col.display ? 'white' : 'grey-8'" flat dense>
            <q-tooltip>Remove column</q-tooltip>
          </q-btn>
          <q-btn :icon="col.display ? 'mdi-eye' : 'mdi-eye-off'" @click="$emit('toggle')" :color="col.display ? 'white' : 'grey-8'" flat dense>
            <q-tooltip>{{col.display ? 'Hide this column' : 'Show this column'}}</q-tooltip>
          </q-btn>
        </div>
      </q-item-label>
      <q-item-label subtitle>
        <q-slider class="col-8" :min="50" :max="col.__dest === 'etc' ? 2500 : 800" :step="25"
          :value="col.width" @change="value => {col.width = value, $emit('width', value)}"
          dark
          color="grey-8"
        />
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  props: [ 'col' ]
}
</script>
