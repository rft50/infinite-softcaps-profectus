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
import {BaseLayer, createLayer} from "game/layers";
import type {DecimalSource} from "util/bignum";
import Decimal, {format} from "util/bignum";
import {createLayerTreeNode} from "../common";
import {render, renderRow} from "../../util/vue";
import {computed, ComputedRef, watch} from "vue";
import {createClickable, GenericClickable} from "../../features/clickables/clickable";
import {persistent} from "../../game/persistence";
import antimatter from "./antimatter";
import {Buyable, BuyableOptions, createBuyable} from "../../features/buyable";

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

    function dimensionMultiplier(idx: number) {
        return computed(() => Decimal.mul(Decimal.pow(2, boughtDimensionCount(idx)),
            Decimal.pow(1.5, dimensionShiftBuyable.amount.value)))
    }

    function dimensionDataTwoDownRow(idx: number) {
        let antimatterBoughtCount = computed(() => dimensionPersistent.value[idx-1]?.antimatterBoughtCount)
        let antimatterCostFunction = dimensionCostFunction(idx, antimatterBoughtCount)
        let specialBoughtCount = computed(() => dimensionPersistent.value[idx-1]?.specialBoughtCount)
        let specialCostFunction = dimensionCostFunction(idx - 1, specialBoughtCount)
        let specialDimensionCount = dimensionCountComputable(idx - 2)
        return {
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
    }

    function dimensionDataTwinRow(idx: number) {
        let antimatterBoughtCount = computed(() => dimensionPersistent.value[idx - 1]?.antimatterBoughtCount)
        let antimatterCostFunction = dimensionCostFunction(idx, antimatterBoughtCount)
        let specialBoughtCount = computed(() => dimensionPersistent.value[idx - 1]?.specialBoughtCount)
        let specialCostFunction = dimensionCostFunction(idx, specialBoughtCount)
        return {
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
        while (dimensionData.length < dimensionCount.value.toNumber()) { // increment
            let i = dimensionData.length
            dimensionData[i] = dimensionDataTwoDownRow(i+1)
            dimensionIndexArray[i] = i+1
            if (dimensionPersistent.value[i] == null) {
                dimensionPersistent.value[i] = persistentEmptyRow()
            }
        }
    }

    // other dimensional things

    const lastDimensionResource = createResource(computed(() => dimensionCountComputable(dimensionCount.value.toNumber()).value), `dimension ?`)

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
            correctDimensionCount()

            // reset dimension data
            points.value = Decimal.dTen
            dimensionIndexArray.forEach(i => {
                dimensionPersistent.value[i - 1] = persistentEmptyRow()
            })
        }
    }))

    watch(dimensionCount, () => {
        lastDimensionResource.displayName = `dimension ${dimensionCount.value?.toNumber()}`
    })

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

    this.on("preUpdate", () => { // TODO replace with global bus onLoad when that exists
        correctDimensionCount()
    })

    this.on("preUpdate", (dt) => {
        points.value = Decimal.add(points.value, Decimal.mul(dimensionData[0].multiplier.value, Decimal.mul(dimensionCountComputable(1).value, dt)))
        for (let i = 2; i <= dimensionIndexArray.length; i++) {
            addDimensionCount(i-1, Decimal.mul(dimensionData[i-1].multiplier.value, Decimal.mul(dimensionCountComputable(i).value, dt)))
        }
    })

    const dimensionRender = jsx(() => (
        <table>
            {dimensionIndexArray.map((i) => <tr>
                <td>Dimension {i}</td>
                <td>{format(dimensionCountComputable(i).value)}</td>
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
                <MainDisplay resource={points} color={color} />
                {render(dimensionRender)}
                {renderRow(dimensionShiftBuyable)}
            </>
        )),
        treeNode,
        dimensionPersistent,
        dimensionShiftBuyable
    };
});

export default layer;
