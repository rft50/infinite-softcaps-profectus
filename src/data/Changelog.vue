<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <h2>Changelog</h2>
        </template>
        <template v-slot:body>
            <details open>
                <summary>v1.0 Infinite Matter - <time>2022-07-29</time></summary>
                <ul>
                    <li class="feature">Added hyper</li>
                    <li class="feature">Added Antiboost Unlock and Antiboost</li>
                    <li class="feature">Added Cosecant, Secant, Hyperbolic, and Foundationless</li>
                </ul>
            </details>
            <details>
                <summary>v0.5 Nothing That Matters - <time>2022-07-23</time></summary>
                <ul>
                    <li class="feature">Added Infinity Layer</li>
                    <li class="balancing">Hardcapped 'Logarithm Foundation' to +40</li>
                    <li class="balancing">Hardcapped 'Exponential Foundation' to +0.02</li>
                    <li class="balancing">Hardcapped 'Hyperbolic Foundation to +0.03</li>
                </ul>
            </details>
            <details>
                <summary>v0.4 Antiupgrade - <time>2022-07-22</time></summary>
                <ul>
                    <li class="feature">Added Antimatter Layer</li>
                    <li class="feature">Added Antimatter Dimensions</li>
                    <li class="feature">Added Dimension Boost/Shift</li>
                    <li class="balancing">Removed Infinite Softcap from Matter</li>
                    <li class="balancing">Reduced 'Antimatter Unlock' Cost to e100 Matter</li>
                    <li class="balancing">Infinitely Softcapped Effective Dimension Count</li>
                    <li class="balancing">Infinitely Softcapped Dimension Multiplier</li>
                    <li class="balancing">Locked Antimatter behind its Unlock</li>
                </ul>
            </details>
            <details>
                <summary>v0.3 Antimaterialism - <time>2022-07-21</time></summary>
                <ul>
                    <li class="feature">Added Antimatter Layer</li>
                    <li class="feature">Added Antimatter Dimensions</li>
                    <li class="feature">Added Dimension Boost/Shift</li>
                </ul>
            </details>
            <details>
                <summary>v0.2 All That Matters - <time>2022-07-17</time></summary>
                <ul>
                    <li class="feature">Added Logarithm Boost</li>
                    <li class="feature">Added Cosine Boost</li>
                    <li class="feature">Added Exponential Boost</li>
                    <li class="feature">Added Hyperbolic Boost</li>
                    <li class="feature">Added Antimatter Unlock</li>
                    <li class="balancing">Rebalanced the entirety of Matter again</li>
                    <li class="balancing">Nerfed Cosine's effect</li>
                    <li class="balancing">Nerfed Cosine Foundation's effect</li>
                    <li class="balancing">Nerfed Exponential Foundation's effect</li>
                    <li class="balancing">Nerfed Hyperbolic Foundation's effect</li>
                    <li class="balancing">Infinitely Softcapped Matter</li>
                    <li class="balancing">Infinitely Softcapped Logarithm's effect</li>
                    <li class="balancing">Infinitely Softcapped Exponential's effect</li>
                    <li class="balancing">Infinitely Softcapped Sine's min and max</li>
                    <li class="balancing">Infinitely Softcapped Hyperbolic's effect</li>
                </ul>
            </details>
            <details>
                <summary>v0.1 Dimensional Generator - <time>2022-07-17</time></summary>
                <ul>
                    <li class="feature">Removed Points</li>
                    <li class="feature">Added Dimensional Generator</li>
                    <li class="feature">Added Exponential</li>
                    <li class="feature">Added Hyperbolic</li>
                    <li class="feature">Added Cosine Foundation</li>
                    <li class="feature">Added Exponential Unlock</li>
                    <li class="feature">Added Hyperbolic Unlock</li>
                    <li class="feature">Added Exponential Foundation</li>
                    <li class="feature">Added Hyperbolic Foundation</li>
                    <li class="feature">Added Autobuyer Milestones to Matter</li>
                    <li class="balancing">Changed Sine Foundation's effect</li>
                    <li class="balancing">Rebalanced the entirety of Matter</li>
                </ul>
            </details>
            <details>
                <summary>v0.0 Initial Commit - <time>2022-07-15</time></summary>
                This is the first release :D
                <ul>
                    <li class="feature">Added Foundation</li>
                    <li class="feature">Added Sine</li>
                    <li class="feature">Added Logarithm</li>
                    <li class="feature">Added Cosine</li>
                    <li class="feature">Added Sine Foundation</li>
                    <li class="feature">Added Sine Boost</li>
                    <li class="feature">Added Logarithm Unlock</li>
                    <li class="feature">Added Logarithm Foundation</li>
                    <li class="feature">Added Cosine Unlock</li>
                </ul>
            </details>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import Modal from "components/Modal.vue";
import { ref } from "vue";

const isOpen = ref(false);

defineExpose({
    open() {
        isOpen.value = true;
    }
});
</script>

<style scoped>
details {
    margin: 10px 0;
    padding-left: 18px;
}

summary {
    cursor: pointer;
    margin-bottom: 10px;
    margin-left: -18px;
}

ul {
    margin: var(--feature-margin) 0;
    background: var(--raised-background);
    border: 2px solid rgba(0, 0, 0, 0.125);
    padding: 5px 5px 5px 15px;
    list-style: inside;
}

li {
    margin: 8px 0;
}

li::before {
    padding: 2px 8px;
    margin-right: 8px;
    border-radius: var(--border-radius);
}

.feature::before {
    content: "Feature";
    background: var(--accent1);
}

.fix::before {
    content: "Fix";
    background: var(--accent2);
}

.balancing::before {
    content: "Balancing";
    background: var(--accent3);
}

.breaking::before {
    content: "Breaking";
    background: var(--danger);
}
</style>
