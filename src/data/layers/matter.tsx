/**
 * @module
 * @hidden
 */
import {jsx, Visibility} from "features/feature";
import {createReset} from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import {createResource} from "features/resources/resource";
import {addTooltip} from "features/tooltips/tooltip";
import {createResourceTooltip} from "features/trees/tree";
import {createLayer} from "game/layers";
import type {DecimalSource} from "util/bignum";
import Decimal, {format} from "util/bignum";
import {createLayerTreeNode} from "../common";
import {createBuyable} from "../../features/buyable";
import {renderRow} from "../../util/vue";
import {computed} from "vue";
import player from "../../game/player";
import {createUpgrade} from "../../features/upgrades/upgrade";

const id = "m";
const layer = createLayer(id, () => {
    const name = "Matter";
    const color = "#336BDC";

    // upgrades

    const foundationSineEffect = computed(() => {return Decimal.div(sineBuyable.amount.value, 10)})

    const foundationSineUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 40,
        display: {
            title: "Sine Foundation",
            description: `Increase Foundation's effect by 0.1 per Sine bought<br>
                Currently ${format(foundationSineEffect.value)}`
        }
    }))

    const sineBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 250,
        display: {
            title: "Sine Boost",
            description: `Multiply Sine's minimum by 1.5 and maximum by 2, per upgrade purchased`
        }
    }))

    const logarithmUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1800,
        display: {
            title: "Logarithm Unlock",
            description: `Unlock Logarithm, which increases length based on matter`
        }
    }))

    const upgradeData = {
        foundationSine: foundationSineUpgrade,
        sineBoost: sineBoostUpgrade,
        logarithmUnlock: logarithmUnlockUpgrade
    }

    const upgradeCount = computed(() => {
        return Object.values(upgradeData).filter(u => u.bought.value).length
    })

    // buyables

    const foundationLength = computed(() => {
        let foundationLength = new Decimal(1)
        if (foundationSineUpgrade.bought.value) foundationLength = foundationLength.add(foundationSineEffect.value)
        return foundationLength
    })

    const foundationBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = new Decimal(this.amount.value)
            return Decimal.pow(1.2, x)
        },
        display() {
            return {
                title: "Foundation",
                description: `Increases length by ${format(foundationLength.value)}`
            }
        }
    }))

    const logarithmLength = computed(() => {
        return Decimal.pow(Decimal.log10(Decimal.max(10, points.value)), 2)
    })

    const logarithmBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = new Decimal(this.amount.value)
            return Decimal.mul(100, new Decimal(1.5).pow(x))
        },
        display() {
            return {
                title: "Logarithm",
                description: `Increases length by log<sub>10</sub>(matter)<sup>2</sup><br>
                    Currently ${format(logarithmLength.value)}`
            }
        },
        visibility() {
            return logarithmUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None
        }
    }))

    const sineMin = computed(() => {
        let count = new Decimal(0.01)

        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(1.5, upgradeCount.value))

        return count
    })
    const sineMax = computed(() => {
        let count = new Decimal(0.1)

        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(2, upgradeCount.value))

        return count
    })

    const sineTempo = computed(() => {return (Math.sin(player.time * Math.PI / 180 / 120) + 1) / 2})
    const sineValue = computed(() => {
        const min = Decimal.log10(sineMin.value)
        const delta = Decimal.log10(sineMax.value).minus(min)

        return Decimal.dTen.pow(min.plus(delta.mul(sineTempo.value)))
    })

    const sineBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = new Decimal(this.amount.value)
            return Decimal.mul(4, new Decimal(1.25).pow(x))
        },
        display() {
            return {
                title: "Sine",
                description: `Increases width by between ${format(sineMin.value)} to ${format(sineMax.value)}<br>
                    Currently ${format(sineValue.value)}`
            }
        }
    }))

    const buyableData = {
        foundation: foundationBuyable,
        sine: sineBuyable,
        logarithm: logarithmBuyable
    }

    // points

    const points = createResource<DecimalSource>(computed(() => {
        let length = new Decimal(1)
        length = length.add(Decimal.mul(foundationBuyable.amount.value, foundationLength.value))
        length = length.add(Decimal.mul(logarithmBuyable.amount.value, logarithmLength.value))

        let width = new Decimal(1)
        width = width.add(Decimal.mul(sineValue.value, sineBuyable.amount.value))

        return length.mul(width)
    }), "matter");

    // serialization and stuff

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {renderRow(foundationBuyable, logarithmBuyable)}
                {renderRow(sineBuyable)}
                {renderRow(foundationSineUpgrade, sineBoostUpgrade, logarithmUnlockUpgrade)}
            </>
        )),
        treeNode,
        upgradeData,
        buyableData
    };
});

export default layer;
