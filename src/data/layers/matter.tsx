/**
 * @module
 * @hidden
 */
import {jsx} from "features/feature";
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

    const sineMin = computed(() => {return Decimal.log10(0.01)})
    const sineMax = computed(() => {return Decimal.log10(0.1)})

    const sineTempo = computed(() => {return (Math.sin(player.time * Math.PI / 180 / 60) + 1) / 2})
    const sineValue = computed(() => {
        const min = sineMin.value
        const delta = sineMax.value.minus(min)

        return Decimal.dTen.pow(min.plus(delta.mul(sineTempo.value)))
    })

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

    const sineBuyable = createBuyable(() => ({
        resource: points,
        cost() {
            let x = new Decimal(this.amount.value)
            return Decimal.mul(4, new Decimal(1.25).pow(x))
        },
        display() {
            return {
                title: "Sine",
                description: `Increases width by between 0.01 to 0.1<br>
                    Currently ${format(sineValue.value)}`
            }
        }
    }))

    // points

    const points = createResource<DecimalSource>(computed(() => {
        let length = new Decimal(1)
        length = length.add(Decimal.mul(foundationBuyable.amount.value, foundationLength.value))

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

    const upgradeData = {
        foundationSine: foundationSineUpgrade
    }

    const buyableData = {
        foundation: foundationBuyable,
        sine: sineBuyable
    }

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <MainDisplay resource={points} color={color} />
                {renderRow(foundationBuyable)}
                {renderRow(sineBuyable)}
                {renderRow(foundationSineUpgrade)}
            </>
        )),
        treeNode,
        upgradeData,
        buyableData
    };
});

export default layer;
