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

    function costBuyableCount(buyable: any) {
        let x = buyable.amount.value
        x = Decimal.sub(x, cosineEffect.value)
        return x
    }

    // upgrades

    const foundationSineEffect = computed(() => {return Decimal.div(sineBuyable.amount.value, 10)})

    const foundationSineUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 700,
        display: {
            title: "Sine Foundation",
            description: `Increase Foundation's effect by 0.1 per Sine bought`
        }
    }))

    const sineBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 5e3,
        display: {
            title: "Sine Boost",
            description: `Multiply Sine's minimum by 1.5 and maximum by 2, per upgrade purchased`
        }
    }))

    const logarithmUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 40e3,
        display: {
            title: "Logarithm Unlock",
            description: `Unlock Logarithm, which increases Foundation's effect based on matter`
        }
    }))

    const logarithmFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 600e3,
        display: {
            title: "Logarithm Foundation",
            description: `Increase Logarithm's exponent by 0.01 per Foundation bought`
        }
    }))

    const cosineUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 15e6,
        display: {
            title: "Cosine Unlock",
            description: `Unlock Cosine, which decreases buyable levels for cost purposes`
        }
    }))

    const upgradeData = {
        foundationSine: foundationSineUpgrade,
        sineBoost: sineBoostUpgrade,
        logarithmUnlock: logarithmUnlockUpgrade,
        logarithmFoundation: logarithmFoundationUpgrade,
        cosineUnlockUpgrade: cosineUnlockUpgrade
    }

    const upgradeCount = computed(() => {
        return Object.values(upgradeData).filter(u => u.bought.value).length
    })

    // buyables

    const foundationLength = computed(() => {
        let foundationLength = new Decimal(1)
        foundationLength = foundationLength.add(Decimal.mul(logarithmBuyable.amount.value, logarithmLength.value))
        if (foundationSineUpgrade.bought.value) foundationLength = foundationLength.add(foundationSineEffect.value)
        return foundationLength
    })

    const foundationBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = costBuyableCount(this)
            return Decimal.pow(1.2, x)
        },
        display() {
            return {
                title: "Foundation",
                description: `Increases length by ${format(foundationLength.value)}`
            }
        }
    }))

    const logarithmExponent = computed(() => {
        let exp = new Decimal(1)
        if (logarithmFoundationUpgrade.bought.value) exp = exp.add(Decimal.div(foundationBuyable.amount.value, 100))
        return exp
    })

    const logarithmLength = computed(() => {
        return Decimal.div(Decimal.pow(Decimal.log10(Decimal.max(10, points.value)), logarithmExponent.value), 10)
    })

    const logarithmBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = costBuyableCount(this)
            return Decimal.mul(100, Decimal.pow(1.4, x))
        },
        display() {
            return {
                title: "Logarithm",
                description: `Increases Foundation's effect by log<sub>10</sub>(matter)<sup>${format(logarithmExponent.value)}</sup>/10<br>
                    Currently ${format(logarithmLength.value)}`
            }
        },
        visibility() {
            return logarithmUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None
        }
    }))

    const sineMin = computed(() => {
        let count = new Decimal(0.1)

        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(1.5, upgradeCount.value))

        return count
    })
    const sineMax = computed(() => {
        let count = new Decimal(1)

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
            let x = costBuyableCount(this)
            return Decimal.mul(10, Decimal.pow(1.25, x))
        },
        display() {
            return {
                title: "Sine",
                description: `Increases width by between ${format(sineMin.value)} to ${format(sineMax.value)}<br>
                    Currently ${format(sineValue.value)}`
            }
        }
    }))

    const cosineTempo = computed(() => {return (Math.cos(player.time * Math.PI / 180 / 120) + 1) / 2})
    const cosineValue = computed(() => {
        return Decimal.mul(Decimal.sub(1, cosineTempo.value), 0.5)
    })
    const cosineEffect = computed(() => {
        return Decimal.mul(cosineBuyable.amount.value, cosineValue.value)
    })

    const cosineBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = costBuyableCount(this)
            return Decimal.mul(1e3, Decimal.pow(1.5, x))
        },
        display() {
            return {
                title: "Cosine",
                description: `Decreases buyable count for cost purposes of all matter buyables, by up to 0.5<br>
                    Currently ${format(cosineValue.value)}`
            }
        },
        visibility() {
            return cosineUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None
        }
    }))

    const buyableData = {
        foundation: foundationBuyable,
        logarithm: logarithmBuyable,
        sine: sineBuyable,
        cosine: cosineBuyable
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
                {renderRow(sineBuyable, cosineBuyable)}
                {renderRow(foundationSineUpgrade, sineBoostUpgrade, logarithmUnlockUpgrade, logarithmFoundationUpgrade, cosineUnlockUpgrade)}
            </>
        )),
        treeNode,
        upgradeData,
        buyableData
    };
});

export default layer;
