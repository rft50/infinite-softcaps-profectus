<script setup lang="ts">
import { format } from "../util/bignum";
import { computed, unref } from "vue";
import matter from "../data/layers/matter";
import antimatter from "../data/layers/antimatter";
import infinity from "../data/layers/infinity";
import { Visibility } from "../features/feature";
import Decimal from "../util/bignum";

const visibleLayers = computed(() =>
    [matter, antimatter].filter(l => unref(l.treeNode.visibility) === Visibility.Visible)
);
</script>

<template>
    <div>
        <template v-for="(l, i) of visibleLayers" :key="l.id">
            <span :style="'color: ' + l.color">{{
                format(Decimal.log10(Decimal.add(unref(l.points), 1)))
            }}</span>
            <span v-if="i !== visibleLayers.length - 1">+</span>
        </template>
        =
        <span :style="'color: ' + infinity.color">{{ format(unref(infinity.matterProduct)) }}</span>
    </div>
</template>
