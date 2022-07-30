<script setup lang="ts">
import matter from "../data/layers/matter";
import { computed, unref } from "vue";
import { format } from "../util/bignum";

const dimensions = matter.dimensions;

const visibleDimensions = computed(() =>
    ["length", "width", "height", "hyper"].filter(d => unref(dimensions[d].visible))
);
</script>

<template>
    <div>
        <table>
            <tr>
                <template v-for="(d, i) of visibleDimensions" :key="d">
                    <td :style="'color: ' + dimensions[d].color">{{ d }}</td>
                    <td style="width: 2em" v-if="i !== visibleDimensions.length - 1">x</td>
                </template>
            </tr>
            <tr>
                <template v-for="(d, i) of visibleDimensions" :key="d">
                    <td :style="'color: ' + dimensions[d].color">
                        {{ format(unref(dimensions[d].value)) }}
                    </td>
                    <td v-if="i !== visibleDimensions.length - 1">x</td>
                </template>
            </tr>
        </table>
    </div>
</template>
