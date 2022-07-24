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
import {BaseLayer, createLayer} from "game/layers";
import type {DecimalSource} from "util/bignum";
import Decimal, {format} from "util/bignum";
import {createLayerTreeNode, infiniteSoftcap} from "../common";
import {render, renderRow} from "../../util/vue";
import {computed, ComputedRef, watch} from "vue";
import {createClickable, GenericClickable, setupAutoClick} from "../../features/clickables/clickable";
import {persistent} from "../../game/persistence";
import antimatter from "./antimatter";
import {Buyable, BuyableOptions, createBuyable} from "../../features/buyable";
import {globalBus} from "../../game/events";
import {createUpgrade} from "../../features/upgrades/upgrade";
import matter from "./matter";

type DimensionData = {
    multiplier: ComputedRef<Decimal>
    antimatterClickable: GenericClickable
    specialClickable: GenericClickable
}

type DimensionSaveData = {
    count: Decimal
    antimatterBoughtCount: Decimal
    specialBoughtCount: Decimal
}

const id = "am";
const layer = createLayer(id, function(this: BaseLayer) {
    const name = "Antimatter";
    const color = "#DC336B";

    const points = createResource<DecimalSource>(10, "antimatter");

    // numbers

    function boughtDimensionCount(idx: number) {
        let persist = dimensionPersistent.value[idx-1]
        return Decimal.add(persist?.antimatterBoughtCount, persist?.specialBoughtCount)
    }

    function dimensionBaseCost(idx: number) {
        return Decimal.pow10((idx + 1) * idx / 2)
    }

    function dimensionScalingCost(idx: number) {
        let third = Math.floor((idx - 1) / 3) + 1
        let substep = ((idx - 1) % 3) * third
        return Decimal.pow10((third - 1) * third * 3 / 2 + substep + 3)
    }

    function dimensionCostFunction(idx: number, source: ComputedRef<Decimal>) {
        let base = dimensionBaseCost(idx)
        let scaling = dimensionScalingCost(idx)
        return function() {
            let count = source.value
            return base.mul(scaling.pow(count))
        }
    }

    // persistence access
    let dimensionCountComputableCache: ComputedRef<Decimal>[] = []
    function dimensionCountComputable(idx: number) {
        if (dimensionCountComputableCache[idx]) return dimensionCountComputableCache[idx]
        dimensionCountComputableCache[idx] = computed(() => dimensionPersistent.value[idx - 1]?.count)
        return dimensionCountComputableCache[idx]
    }

    function addDimensionCount(idx: number, amount: DecimalSource) {
        dimensionPersistent.value[idx-1].count = Decimal.add(dimensionPersistent.value[idx-1]?.count, amount)
    }

    // dimension data generators

    function persistentEmptyRow() {
        return {
            count: Decimal.dZero,
            antimatterBoughtCount: Decimal.dZero,
            specialBoughtCount: Decimal.dZero
        }
    }

    const dimensionBaseMultiplier = computed(() => {
        let mul = Decimal.pow(1.5, dimensionShiftBuyable.amount.value)

        if (lowDimensionalityUpgrade.bought.value) mul = mul.mul(dimensionCount.value)
        if (highDimensionalityUpgrade.bought.value) mul = mul.mul(dimensionLimit.value)

        return mul
    })

    function dimensionMultiplier(idx: number) {
        return computed(() => infiniteSoftcap(Decimal.mul(dimensionBaseMultiplier.value, Decimal.pow(2, boughtDimensionCount(idx)))))
    }

    const dimensionDataTwoDownRow = (idx: number) => {
        const antimatterBoughtCount = computed(() => dimensionPersistent.value[idx-1]?.antimatterBoughtCount)
        const antimatterCostFunction = dimensionCostFunction(idx, antimatterBoughtCount)
        const specialBoughtCount = computed(() => dimensionPersistent.value[idx-1]?.specialBoughtCount)
        const specialCostFunction = dimensionCostFunction(idx - 1, specialBoughtCount)
        const specialDimensionCount = dimensionCountComputable(idx - 2)
        const data = {
            multiplier: dimensionMultiplier(idx),
            antimatterClickable: createClickable(() => ({
                display: jsx(() => (<>
                    Buy dimension with antimatter<br/><br/>
                    Costs {format(antimatterCostFunction())}<br/><br/>
                    {format(antimatterBoughtCount.value)} Bought
                </>)),
                canClick: computed(() => Decimal.gte(points.value, antimatterCostFunction())),
                onClick() {
                    let cost = antimatterCostFunction()
                    if (Decimal.gte(points.value, cost)) {
                        points.value = Decimal.sub(points.value, cost)
                        dimensionPersistent.value[idx-1].antimatterBoughtCount = Decimal.add(dimensionPersistent.value[idx-1]?.antimatterBoughtCount, 1)
                        dimensionPersistent.value[idx-1].count = Decimal.add(dimensionPersistent.value[idx-1]?.count, 1)
                    }
                }
            })),
            specialClickable: createClickable(() => ({
                display: jsx(() => (<>
                    Buy dimension with dimension {idx-2}<br/><br/>
                    Costs {format(specialCostFunction())}<br/><br/>
                    {format(specialBoughtCount.value)} Bought
                </>)),
                canClick: computed(() => Decimal.gte(specialDimensionCount.value, specialCostFunction())),
                onClick() {
                    let cost = specialCostFunction()
                    if (Decimal.gte(specialDimensionCount.value, cost)) {
                        dimensionPersistent.value[idx-3].count = Decimal.sub(specialDimensionCount.value, cost)
                        dimensionPersistent.value[idx-1].specialBoughtCount = Decimal.add(dimensionPersistent.value[idx-1]?.specialBoughtCount, 1)
                        dimensionPersistent.value[idx-1].count = Decimal.add(dimensionPersistent.value[idx-1]?.count, 1)
                    }
                }
            }))
        }

        const autobuyComputed = computed(() => Decimal.gte(dimensionAutobuyerCount.value, idx))

        setupAutoClick(this, data.antimatterClickable, autobuyComputed)
        setupAutoClick(this, data.specialClickable, autobuyComputed)

        return data
    }

    const dimensionDataTwinRow = (idx: number) => {
        const antimatterBoughtCount = computed(() => dimensionPersistent.value[idx - 1]?.antimatterBoughtCount)
        const antimatterCostFunction = dimensionCostFunction(idx, antimatterBoughtCount)
        const specialBoughtCount = computed(() => dimensionPersistent.value[idx - 1]?.specialBoughtCount)
        const specialCostFunction = dimensionCostFunction(idx, specialBoughtCount)
        const data = {
            multiplier: dimensionMultiplier(idx),
            antimatterClickable: createClickable(() => ({
                display: jsx(() => (<>
                    Buy dimension with antimatter<br/><br/>
                    Costs {format(antimatterCostFunction())}<br/><br/>
                    {format(antimatterBoughtCount.value)} Bought
                </>)),
                canClick: computed(() => Decimal.gte(points.value, antimatterCostFunction())),
                onClick() {
                    let cost = antimatterCostFunction()
                    if (Decimal.gte(points.value, cost)) {
                        points.value = Decimal.sub(points.value, cost)
                        dimensionPersistent.value[idx - 1].antimatterBoughtCount = Decimal.add(dimensionPersistent.value[idx - 1]?.antimatterBoughtCount, 1)
                        dimensionPersistent.value[idx - 1].count = Decimal.add(dimensionPersistent.value[idx - 1]?.count, 1)
                    }
                }
            })),
            specialClickable: createClickable(() => ({
                display: jsx(() => (<>
                    Buy dimension with antimatter<br/><br/>
                    Costs {format(specialCostFunction())}<br/><br/>
                    {format(specialBoughtCount.value)} Bought
                </>)),
                canClick: computed(() => Decimal.gte(points.value, specialCostFunction())),
                onClick() {
                    let cost = specialCostFunction()
                    if (Decimal.gte(points.value, cost)) {
                        points.value = Decimal.sub(points.value, cost)
                        dimensionPersistent.value[idx - 1].specialBoughtCount = Decimal.add(dimensionPersistent.value[idx - 1]?.specialBoughtCount, 1)
                        dimensionPersistent.value[idx - 1].count = Decimal.add(dimensionPersistent.value[idx - 1]?.count, 1)
                    }
                }
            }))
        }

        const autobuyComputed = computed(() => Decimal.gte(dimensionAutobuyerCount.value, idx))

        setupAutoClick(this, data.antimatterClickable, autobuyComputed)
        setupAutoClick(this, data.specialClickable, autobuyComputed)

        return data
    }

    // dimension data

    const dimensionCount = computed(() => Decimal.min(Decimal.add(4, dimensionShiftBuyable.amount.value), dimensionLimit.value))
    const dimensionLimit = computed<number>(() => 8)

    const dimensionIndexArray = [1, 2]

    const dimensionPersistent = persistent<DimensionSaveData[]>([persistentEmptyRow(), persistentEmptyRow()])

    const dimensionData: DimensionData[] = [
        dimensionDataTwinRow(1),
        dimensionDataTwinRow(2)
    ]

    function correctDimensionCount() {
        let dimCount = dimensionCount.value.floor().toNumber()

        while (dimensionData.length < dimCount) { // increment
            dimensionData.push(dimensionDataTwoDownRow(dimensionData.length + 1))
        }
        while (dimensionData.length > dimCount) { // decrement
            dimensionData.pop()
        }

        while (dimensionIndexArray.length < dimCount) { // increment
            dimensionIndexArray.push(dimensionIndexArray.length + 1)
        }
        while (dimensionIndexArray.length > dimCount) { // decrement
            dimensionIndexArray.pop()
        }

        while (dimensionPersistent.value.length < dimCount) { // increment
            dimensionPersistent.value.push(persistentEmptyRow())
        }
        while (dimensionPersistent.value.length > dimCount) { // decrement
            dimensionPersistent.value.pop()
        }
    }


    // other dimensional things

    const lastDimensionResource = createResource(computed(() => dimensionCountComputable(dimensionCount.value.toNumber()).value), `dimension 4`)

    const dimensionShiftBuyable: Buyable<BuyableOptions> = createBuyable(() => ({
        resource: lastDimensionResource,
        cost: computed(() => {
            let boostCount = Decimal.sub(dimensionShiftBuyable.amount.value, Decimal.sub(dimensionLimit.value, 4))
            return Decimal.add(Decimal.mul(Decimal.max(boostCount, 0), 4), 2)
        }),
        display() {
            if (Decimal.eq(dimensionCount.value, dimensionLimit.value)) { // boosting
                return {
                    title: "Dimension Boost",
                    description: "Reset dimensions and antimatter, but multiply all dimensions by 1.5"
                }
            }
            else { // shifting
                return {
                    title: "Dimension Shift",
                    description: "Reset dimensions and antimatter, but unlock a new dimension, and multiply all dimensions by 1.5"
                }
            }
        },
        onPurchase() {
            // reset dimension data
            points.value = Decimal.dTen
            dimensionIndexArray.forEach(i => {
                dimensionPersistent.value[i - 1] = persistentEmptyRow()
            })
        }
    }))

    watch(dimensionCount, () => {
        correctDimensionCount()
        lastDimensionResource.displayName = `dimension ${dimensionCount.value?.toNumber()}`
    })

    // upgrades

    const lowDimensionalityUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 100,
        display: {
            title: "Low Dimensionality",
            description: `Multiply each dimension by the amount of dimensions currently available`
        }
    }))

    const upgradeAutobuyerUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e25,
        display: {
            title: "Upgrade Autobuyer",
            description: `Gain 1 Dimension Autobuyer per Upgrade Bought`
        }
    }))

    const highDimensionalityUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e50,
        display: {
            title: "High Dimensionality",
            description: `Multiply each dimension by the amount of dimensions currently available`
        }
    }))

    const shiftingAutobuyerUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e75,
        display: {
            title: "Shifting Autobuyer",
            description: `Gain 0.5 Dimension Autobuyer per Dimension Boost/Shift`
        }
    }))

    const exoticMatterUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e100,
        display: {
            title: "Exotic Matter Unlock",
            description: `Unlock Exotic Matter, which is a new layer`
        }
    }))

    const upgradeData = {
        lowDimensionality: lowDimensionalityUpgrade,
        upgradeAutobuyer: upgradeAutobuyerUpgrade,
        highDimensionality: highDimensionalityUpgrade,
        shiftingAutobuyer: shiftingAutobuyerUpgrade,
        exoticMatterUnlock: exoticMatterUnlockUpgrade
    }

    const upgradeCount = computed(() => {
        return Object.values(upgradeData).filter(u => u.bought.value).length
    })

    const dimensionAutobuyerCount = computed(() => {
        let count = Decimal.dZero

        if (upgradeAutobuyerUpgrade.bought.value) count = count.add(upgradeCount.value)
        if (shiftingAutobuyerUpgrade.bought.value) count = count.add(Decimal.div(dimensionShiftBuyable.amount.value, 2))

        return count
    })

    // serialization and stuff

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        color,
        reset,
        visibility: computed(() => {
            return matter.upgradeData.antimatterUnlock.bought.value ? Visibility.Visible : Visibility.None
        })
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(points),
        pinnable: true
    });

    globalBus.on("onLoad", () => {
        correctDimensionCount()
    })

    this.on("preUpdate", (dt) => {
        points.value = Decimal.add(points.value, Decimal.mul(
            dt,
            Decimal.mul(
                infiniteSoftcap(dimensionCountComputable(1).value),
                dimensionData[0].multiplier.value)
        ))
        for (let i = 2; i <= dimensionIndexArray.length; i++) {
            addDimensionCount(i-1, Decimal.mul(
                dt,
                Decimal.mul(
                    infiniteSoftcap(dimensionCountComputable(i).value),
                    dimensionData[i-1].multiplier.value)
            ))
        }
    })

    const dimensionRender = jsx(() => (
        <table>
            {dimensionIndexArray.map((i) => <tr>
                <td>Dimension {i}</td>
                <td style="color: #DC336B">{format(dimensionCountComputable(i).value)}</td>
                <td>x{format(dimensionData[i - 1]?.multiplier?.value)}</td>
                <td>{render(dimensionData[i - 1]?.antimatterClickable)}</td>
                <td>{render(dimensionData[i - 1]?.specialClickable)}</td>
            </tr>)}
        </table>
    ))

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <div>Each Dimension produces the dimension before it</div>
                <MainDisplay resource={points} color={color} />
                {dimensionAutobuyerCount.value.gt(0) ? `You have ${format(dimensionAutobuyerCount.value)} dimension autobuyers` : ""}
                {render(dimensionRender)}
                {renderRow(dimensionShiftBuyable)}
                {renderRow(lowDimensionalityUpgrade, upgradeAutobuyerUpgrade, highDimensionalityUpgrade, shiftingAutobuyerUpgrade, exoticMatterUnlockUpgrade)}
            </>
        )),
        treeNode,
        dimensionPersistent,
        dimensionShiftBuyable,
        upgradeData
    };
});

export default layer;
