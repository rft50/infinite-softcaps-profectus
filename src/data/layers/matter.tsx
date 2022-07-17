/**
 * @module
 * @hidden
 */
import {jsx, Visibility} from "features/feature";
import {createReset, trackResetTime} from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import {createResource} from "features/resources/resource";
import {addTooltip} from "features/tooltips/tooltip";
import {createResourceTooltip} from "features/trees/tree";
import {BaseLayer, createLayer} from "game/layers";
import type {DecimalSource} from "util/bignum";
import Decimal, {format} from "util/bignum";
import {colorText, createLayerTreeNode} from "../common";
import {BaseBuyable, Buyable, BuyableOptions, createBuyable} from "../../features/buyable";
import {render, renderCol, renderRow} from "../../util/vue";
import {computed, createTextVNode, unref} from "vue";
import player from "../../game/player";
import {createUpgrade} from "../../features/upgrades/upgrade";
import {createMilestone} from "../../features/milestones/milestone";
import {setupAutoClick} from "../../features/clickables/clickable";

const id = "m";
const layer = createLayer(id, function(this: BaseLayer) {
    const name = "Matter";
    const color = "#336BDC";

    function buyableCost(buyable: any, base: number, exponent: number) {
        return function() {
            if (!buyable.amount) return Decimal.dInf
            let count = buyable.amount.value
            count = Decimal.sub(count, cosineEffect.value)

            let cost = Decimal.pow(base, Decimal.mul(Decimal.sign(count), Decimal.pow(Decimal.abs(count), exponent)))
            cost = Decimal.div(cost, exponentialEffect.value)
            return cost
        }
    }

    // shared variables
    const dimensionalGenerator = computed(() => {
        return Decimal.clamp(Decimal.add(Decimal.div(resetTime.value, 60), 1), 1, 1000)
    })

    // upgrades

    const sineFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e3,
        display: {
            title: "Sine Foundation",
            description: `Multiply Sine's minimum by 1.02 and maximum by 1.05, per Foundation purchased`
        }
    }))

    const sineBoostUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 100e3,
        display: {
            title: "Sine Boost",
            description: `Multiply Sine's minimum by 1.5 and maximum by 2, per upgrade purchased`
        }
    }))

    const logarithmUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 10e6,
        display: {
            title: "Logarithm Unlock",
            description: `Unlock Logarithm, which increases Foundation's effect based on matter`
        }
    }))

    const logarithmFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e10,
        display: {
            title: "Logarithm Foundation",
            description: `Increase Logarithm's exponent by 0.01 per Foundation bought`
        }
    }))

    const cosineUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e13,
        display: {
            title: "Cosine Unlock",
            description: `Unlock Cosine, which decreases buyable levels for cost purposes`
        }
    }))

    const cosineFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e15,
        display: {
            title: "Cosine Foundation",
            description: `Increase Cosine's limit by 0.001 per Foundation bought, up to 0.2`
        }
    }))

    const exponentialUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e17,
        display: {
            title: "Exponential Unlock",
            description: `Unlock Exponential, which decreases buyable costs`
        }
    }))

    const hyperbolicUnlockUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e23,
        display: {
            title: "Hyperbolic Unlock",
            description: `Unlock Hyperbolic, which increases Sine's min and max based on matter`
        }
    }))

    const exponentialFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e31,
        display: {
            title: "Exponential Foundation",
            description: `Increase Exponential's effect by 0.00002 per Foundation bought`
        }
    }))

    const hyperbolicFoundationUpgrade = createUpgrade(() => ({
        resource: points,
        cost: 1e35,
        display: {
            title: "Hyperbolic Foundation",
            description: `Increase Hyperbolic's effect by 0.00002 per Foundation bought`
        }
    }))

    const upgradeData = {
        sineFoundation: sineFoundationUpgrade,
        sineBoost: sineBoostUpgrade,
        logarithmUnlock: logarithmUnlockUpgrade,
        logarithmFoundation: logarithmFoundationUpgrade,
        cosineUnlockUpgrade: cosineUnlockUpgrade,
        cosineFoundation: cosineFoundationUpgrade,
        exponentialUnlock: exponentialUnlockUpgrade,
        hyperbolicUnlock: hyperbolicUnlockUpgrade,
        exponentialFoundation: exponentialFoundationUpgrade,
        hyperbolicFoundation: hyperbolicFoundationUpgrade
    }

    const upgradeCount = computed(() => {
        return Object.values(upgradeData).filter(u => u.bought.value).length
    })

    // buyables

    const foundationLength = computed(() => {
        let foundationLength = new Decimal(1)
        foundationLength = foundationLength.add(Decimal.mul(logarithmBuyable.amount.value, logarithmLength.value))
        return foundationLength
    })

    const foundationBuyable: any = createBuyable(() => ({
        resource: points,
        cost: buyableCost(foundationBuyable, 1.2, 1.02),
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

    const logarithmBuyable: any = createBuyable(() => ({
        resource: points,
        cost: buyableCost(logarithmBuyable, 1.4, 1.02),
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

    const exponentialBase = computed(() => {
        let base = new Decimal(1.05)

        if (exponentialFoundationUpgrade.bought.value) base = Decimal.add(base, Decimal.mul(foundationBuyable.amount.value, 0.00002))

        return base
    })
    const exponentialEffect = computed(() => {
        return Decimal.pow(exponentialBase.value, exponentialBuyable.amount.value)
    })

    const exponentialBuyable: any = createBuyable(() => ({
        resource: points,
        cost: buyableCost(exponentialBuyable, 1.6, 1.02),
        display() {
            return {
                title: "Exponential",
                description: `Divides all matter buyable costs by ${format(exponentialBase.value)}`
            }
        },
        visibility() {
            return exponentialUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None
        }
    }))

    const sineMin = computed(() => {
        let count = new Decimal(0.1)

        count = count.mul(Decimal.pow(hyperbolicEffect.value, 0.5))

        if (sineFoundationUpgrade.bought.value) count = count.mul(Decimal.pow(1.02, foundationBuyable.amount.value))
        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(1.5, upgradeCount.value))

        return count
    })
    const sineMax = computed(() => {
        let count = new Decimal(1)

        count = count.mul(hyperbolicEffect.value)

        if (sineFoundationUpgrade.bought.value) count = count.mul(Decimal.pow(1.05, foundationBuyable.amount.value))
        if (sineBoostUpgrade.bought.value) count = count.mul(Decimal.pow(2, upgradeCount.value))

        return count
    })

    const sineTempo = computed(() => {return (Math.sin(player.time * Math.PI / 180 / 120) + 1) / 2})
    const sineValue = computed(() => {
        const min = Decimal.log10(sineMin.value)
        const delta = Decimal.log10(sineMax.value).minus(min)

        return Decimal.dTen.pow(min.plus(delta.mul(sineTempo.value)))
    })

    const sineBuyable: any = createBuyable(() => ({
        resource: points,
        cost: buyableCost(sineBuyable, 1.25, 1.05),
        display() {
            return {
                title: "Sine",
                description: `Increases width by between ${format(sineMin.value)} to ${format(sineMax.value)}<br>
                    Currently ${format(sineValue.value)}`
            }
        }
    }))

    const cosineTempo = computed(() => {return (Math.cos(player.time * Math.PI / 180 / 120) + 1) / 2})
    const cosineLimit = computed(() => {
        let limit = new Decimal(0.2)

        if (cosineFoundationUpgrade.bought.value) limit = Decimal.add(limit, Decimal.min(Decimal.mul(foundationBuyable.amount.value, 0.001), 0.2))

        return limit
    })
    const cosineValue = computed(() => {
        return Decimal.mul(cosineTempo.value, cosineLimit.value)
    })
    const cosineEffect = computed(() => {
        return Decimal.mul(cosineBuyable.amount.value, cosineValue.value)
    })

    const cosineBuyable: any = createBuyable(() => ({
        resource: points,
        cost: buyableCost(cosineBuyable, 1.5, 1.05),
        display() {
            return {
                title: "Cosine",
                description: `Decreases buyable count for cost purposes of all matter buyables, by up to ${format(cosineLimit.value)}<br>
                    Currently ${format(cosineValue.value)}`
            }
        },
        visibility() {
            return cosineUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None
        }
    }))

    const hyperbolicValue = computed(() => {
        let base = new Decimal(1.03)

        if (hyperbolicFoundationUpgrade.bought.value) base = Decimal.add(base, Decimal.mul(foundationBuyable.amount.value, 0.00002))

        return base
    })
    const hyperbolicEffect = computed(() => {
        return Decimal.pow(hyperbolicValue.value, hyperbolicBuyable.amount.value)
    })

    const hyperbolicBuyable: any = createBuyable(() => ({
        resource: points,
        cost: buyableCost(hyperbolicBuyable, 1.75, 1.05),
        display() {
            return {
                title: "Hyperbolic",
                description: `Multiply Sine's maximum by ${format(hyperbolicValue.value)}, and min by sqrt of that`
            }
        },
        visibility() {
            return hyperbolicUnlockUpgrade.bought.value ? Visibility.Visible : Visibility.None
        }
    }))

    const buyableData = {
        foundation: foundationBuyable,
        logarithm: logarithmBuyable,
        exponential: exponentialBuyable,
        sine: sineBuyable,
        cosine: cosineBuyable,
        hyperbolic: hyperbolicBuyable
    }

    // milestones

    const foundationMilestone = createMilestone(() => ({
        shouldEarn() {
            return Decimal.gte(foundationBuyable.amount.value, 200)
        },
        display: {
            requirement: "200 Foundation",
            effectDisplay: "Autobuy Foundation"
        },
        style: {
            width: "250px"
        }
    }))

    const logarithmMilestone = createMilestone(() => ({
        shouldEarn() {
            return Decimal.gte(logarithmBuyable.amount.value, 200)
        },
        display: {
            requirement: "200 Logarithm",
            effectDisplay: "Autobuy Logarithm"
        },
        style: {
            width: "250px"
        }
    }))

    const exponentialMilestone = createMilestone(() => ({
        shouldEarn() {
            return Decimal.gte(exponentialBuyable.amount.value, 200)
        },
        display: {
            requirement: "200 Exponential",
            effectDisplay: "Autobuy Exponential"
        },
        style: {
            width: "250px"
        }
    }))

    const sineMilestone = createMilestone(() => ({
        shouldEarn() {
            return Decimal.gte(sineBuyable.amount.value, 200)
        },
        display: {
            requirement: "200 Sine",
            effectDisplay: "Autobuy Sine"
        },
        style: {
            width: "250px"
        }
    }))

    const cosineMilestone = createMilestone(() => ({
        shouldEarn() {
            return Decimal.gte(cosineBuyable.amount.value, 200)
        },
        display: {
            requirement: "200 Cosine",
            effectDisplay: "Autobuy Cosine"
        },
        style: {
            width: "250px"
        }
    }))

    const hyperbolicMilestone = createMilestone(() => ({
        shouldEarn() {
            return Decimal.gte(hyperbolicBuyable.amount.value, 200)
        },
        display: {
            requirement: "200 Hyperbolic",
            effectDisplay: "Autobuy Hyperbolic"
        },
        style: {
            width: "250px"
        }
    }))

    setupAutoClick(this, foundationBuyable, foundationMilestone.earned)
    setupAutoClick(this, logarithmBuyable, logarithmMilestone.earned)
    setupAutoClick(this, exponentialBuyable, exponentialMilestone.earned)
    setupAutoClick(this, sineBuyable, sineMilestone.earned)
    setupAutoClick(this, cosineBuyable, cosineMilestone.earned)
    setupAutoClick(this, hyperbolicBuyable, hyperbolicMilestone.earned)

    const milestoneData = {
        foundation: foundationMilestone,
        logarithm: logarithmMilestone,
        exponential: exponentialMilestone,
        sine: sineMilestone,
        cosine: cosineMilestone,
        hyperbolic: hyperbolicMilestone
    }

    // points

    const length = computed(() => {
        let base = dimensionalGenerator.value
        base = base.add(Decimal.mul(foundationBuyable.amount.value, foundationLength.value))
        return base
    })
    const width = computed(() => {
        let base = dimensionalGenerator.value
        base = base.add(Decimal.mul(sineValue.value, sineBuyable.amount.value))
        return base
    })
    const height = computed(() => {
        let base = dimensionalGenerator.value
        return base
    })
    const points = createResource<DecimalSource>(computed(() => {
        return Decimal.mul(Decimal.mul(length.value, width.value), height.value)
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

    const resetTime = trackResetTime(this, reset)

    const dimensionalGeneratorDisplay = jsx(() => (
        <>
            <span>
                <div>The dimensional generator has ran for {format(resetTime.value)} seconds.</div>
                <div>This results in +<span>{format(dimensionalGenerator.value)}</span> to all directions</div>
            </span>
        </>
    ))

    return {
        name,
        color,
        points,
        display: jsx(() => (
            <>
                <table>
                    <tr>
                        <td style="color: #336BDC">length</td>
                        <td style="width: 2em">x</td>
                        <td style="color: #336BDC">width</td>
                        <td style="width: 2em">x</td>
                        <td style="color: #336BDC">height</td>
                    </tr>
                    <tr>
                        <td style="color: #336BDC">{format(length.value)}</td>
                        <td>x</td>
                        <td style="color: #336BDC">{format(width.value)}</td>
                        <td>x</td>
                        <td style="color: #336BDC">{format(height.value)}</td>
                    </tr>
                </table>
                <MainDisplay resource={points} color={color} />
                {render(dimensionalGeneratorDisplay)}
                {renderRow(foundationBuyable, logarithmBuyable, exponentialBuyable)}
                {renderRow(sineBuyable, cosineBuyable, hyperbolicBuyable)}
                {renderRow(sineFoundationUpgrade, sineBoostUpgrade, logarithmUnlockUpgrade, logarithmFoundationUpgrade, cosineUnlockUpgrade)}
                {renderRow(cosineFoundationUpgrade, exponentialUnlockUpgrade, hyperbolicUnlockUpgrade, exponentialFoundationUpgrade, hyperbolicFoundationUpgrade)}
                {renderRow(foundationMilestone, logarithmMilestone, exponentialMilestone)}
                {renderRow(sineMilestone, cosineMilestone, hyperbolicMilestone)}
            </>
        )),
        treeNode,
        upgradeData,
        buyableData,
        milestoneData,
        resetTime
    };
});

export default layer;
